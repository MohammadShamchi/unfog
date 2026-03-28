"use client";

import { useCallback, useRef, useEffect } from "react";
import { useInputExperienceStore } from "@/stores/input-experience-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { apiPostWithRetry } from "@/lib/api-client";
import { soundEngine } from "@/lib/sound/sound-engine";

const MAX_QUESTIONS = 3;
const TYPING_SPEED_MS = 30;
const REVEAL_ACK_DELAY_MS = 420;

export function useInputExperience() {
  const questionCountRef = useRef(0);
  const typingFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingFrameRef.current) cancelAnimationFrame(typingFrameRef.current);
    };
  }, []);

  // Character-by-character typing animation
  const typeMessage = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      const store = useInputExperienceStore.getState();
      store.setCurrentAiMessage(message);
      store.setIsAiTyping(true);
      store.setTypedCharIndex(0);

      let charIndex = 0;
      let lastTime = 0;

      function step(time: number) {
        if (!lastTime) lastTime = time;
        const elapsed = time - lastTime;

        if (elapsed >= TYPING_SPEED_MS) {
          charIndex++;
          useInputExperienceStore.getState().setTypedCharIndex(charIndex);
          lastTime = time;
        }

        if (charIndex < message.length) {
          typingFrameRef.current = requestAnimationFrame(step);
        } else {
          useInputExperienceStore.getState().setIsAiTyping(false);
          resolve();
        }
      }

      typingFrameRef.current = requestAnimationFrame(step);
    });
  }, []);

  // Ask AI for a clarifying question
  const askClarification = useCallback(async () => {
    const store = useInputExperienceStore.getState();

    try {
      const res = await apiPostWithRetry("/api/clarify", {
        prompt: store.userText,
        conversation: store.conversation,
      });
      const data = await res.json();

      if (!data.success || data.data.ready || !data.data.question) {
        return true; // ready to analyze
      }

      soundEngine.playClarificationAppear();
      await typeMessage(data.data.question);

      // Add completed AI message to conversation
      const clarifiedStore = useInputExperienceStore.getState();
      clarifiedStore.addMessage({
        role: "assistant",
        content: data.data.question,
      });
      clarifiedStore.setCurrentAiMessage("");
      clarifiedStore.setTypedCharIndex(0);

      questionCountRef.current++;
      return false;
    } catch {
      return true; // on error, skip to analyze
    }
  }, [typeMessage]);

  // Build enriched prompt from conversation
  const buildPrompt = useCallback((): string => {
    const store = useInputExperienceStore.getState();
    let enriched = store.userText;

    if (store.conversation.length > 0) {
      enriched += "\n\n--- Additional context from clarifying questions ---\n";
      const messages = store.conversation;
      for (let i = 0; i < messages.length; i += 2) {
        const q = messages[i];
        const a = messages[i + 1];
        if (q && a) {
          enriched += `\nQ: ${q.content}\nA: ${a.content}\n`;
        }
      }
    }

    return enriched;
  }, []);

  // Trigger reveal phase
  const triggerReveal = useCallback(async () => {
    const store = useInputExperienceStore.getState();

    // Show summary line
    store.setPhase("reveal");
    store.setFogDirection("outward");

    // Wait for summary display
    await new Promise((r) => setTimeout(r, 1200));

    // Call analyze API
    const enrichedPrompt = buildPrompt();
    useCanvasStore.getState().setLoading(true);
    soundEngine.playAiStart();

    try {
      const res = await apiPostWithRetry("/api/analyze", { prompt: enrichedPrompt });
      const data = await res.json();

      if (res.ok && data.data) {
        useCanvasStore.getState().setAnalysis(data.data, enrichedPrompt);
        soundEngine.playAiComplete();
        useHistoryStore.getState().addEntry({
          prompt: enrichedPrompt,
          summary: data.data.summary,
          nodeCount: data.data.nodes.length,
        });
      }
    } catch {
      // handled by existing error flow
    } finally {
      useCanvasStore.getState().setLoading(false);
    }

    // Complete reveal after nodes are set
    await new Promise((r) => setTimeout(r, 2500));
    useInputExperienceStore.getState().setPhase("complete");
    useInputExperienceStore.getState().setFogDirection("none");
  }, [buildPrompt]);

  const transitionToReveal = useCallback(async (message: string) => {
    const store = useInputExperienceStore.getState();

    await typeMessage(message);
    store.addMessage({ role: "assistant", content: message });
    store.setCurrentAiMessage("");
    store.setTypedCharIndex(0);

    await new Promise((resolve) => setTimeout(resolve, REVEAL_ACK_DELAY_MS));
    await triggerReveal();
  }, [typeMessage, triggerReveal]);

  // Transition to clarification phase
  const startClarification = useCallback(async () => {
    const store = useInputExperienceStore.getState();
    if (store.phase !== "invitation") return;
    if (!store.userText.trim()) return;

    store.setPhase("clarification");
    store.setFogDirection("inward");
    questionCountRef.current = 0;

    const ready = await askClarification();
    if (ready) {
      await transitionToReveal("I have enough context. Let me turn this into a clarity map.");
    }
  }, [askClarification, transitionToReveal]);

  // Handle user answer during clarification
  const handleAnswer = useCallback(async (answer: string) => {
    const store = useInputExperienceStore.getState();
    store.addMessage({ role: "user", content: answer });

    if (questionCountRef.current >= MAX_QUESTIONS) {
      await transitionToReveal("Got it. I have enough now, and I’m factoring that in before I map this out.");
      return;
    }

    const ready = await askClarification();
    if (ready || questionCountRef.current >= MAX_QUESTIONS) {
      await transitionToReveal("Got it. I’m factoring that in before I map this out.");
    }
  }, [askClarification, transitionToReveal]);

  // Cmd/Ctrl+Enter handler
  const handleSubmitShortcut = useCallback(() => {
    const store = useInputExperienceStore.getState();
    if (store.phase === "invitation" && store.userText.trim().length > 0) {
      startClarification();
    }
  }, [startClarification]);

  return {
    handleAnswer,
    handleSubmitShortcut,
    startClarification,
    triggerReveal,
  };
}
