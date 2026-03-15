"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { useIntakeStore } from "@/stores/intake-store";
import { buildEnrichedPrompt } from "@/lib/ai/prompts";
import { soundEngine } from "@/lib/sound/sound-engine";
import { apiPostWithRetry } from "@/lib/api-client";
import type { IntakeAnswer } from "@/types/analysis";

export function useIntakeHandler() {
  const generateMap = useCallback(async (finalPrompt: string) => {
    useCanvasStore.getState().setLoading(true);
    soundEngine.playAiStart();
    try {
      const res = await apiPostWithRetry("/api/analyze", { prompt: finalPrompt });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }

      useCanvasStore.getState().setAnalysis(data.data, finalPrompt);
      soundEngine.playAiComplete();
      useHistoryStore.getState().addEntry({
        prompt: finalPrompt,
        summary: data.data.summary,
        nodeCount: data.data.nodes.length,
      });
    } catch {
      toast.error("Request failed. Check your connection.");
    } finally {
      useCanvasStore.getState().setLoading(false);
    }
  }, []);

  const handleIntakeAnswers = useCallback(async (answers: IntakeAnswer[]) => {
    const intakeStore = useIntakeStore.getState();
    const activePrompt = intakeStore.activePrompt;
    intakeStore.submitAnswers(answers);

    const rounds = intakeStore.rounds;
    const roundCount = rounds.length;

    if (roundCount >= 2) {
      const enriched = buildEnrichedPrompt(activePrompt, rounds);
      intakeStore.setEnrichedPrompt(enriched);
      intakeStore.setGenerating();
      await generateMap(enriched);
      intakeStore.reset();
      return;
    }

    intakeStore.startAssessment();
    try {
      const enriched = buildEnrichedPrompt(activePrompt, rounds);
      const assessRes = await apiPostWithRetry("/api/assess", { prompt: enriched });
      const assessData = await assessRes.json();

      if (assessData.success && !assessData.data.sufficient && assessData.data.questions?.length) {
        intakeStore.setQuestions(assessData.data.questions);
        return;
      }

      intakeStore.setEnrichedPrompt(enriched);
      intakeStore.setGenerating();
      await generateMap(enriched);
      intakeStore.reset();
    } catch {
      const enriched = buildEnrichedPrompt(activePrompt, rounds);
      intakeStore.setGenerating();
      await generateMap(enriched);
      intakeStore.reset();
    }
  }, [generateMap]);

  const submitPrompt = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const intakeStore = useIntakeStore.getState();
    intakeStore.reset();
    intakeStore.setActivePrompt(text.trim());
    intakeStore.startAssessment();

    try {
      const assessRes = await apiPostWithRetry("/api/assess", { prompt: text.trim() });
      const assessData = await assessRes.json();

      if (assessData.success && !assessData.data.sufficient && assessData.data.questions?.length) {
        intakeStore.setQuestions(assessData.data.questions);
        return;
      }

      intakeStore.setGenerating();
      await generateMap(text.trim());
      intakeStore.reset();
    } catch {
      intakeStore.setGenerating();
      await generateMap(text.trim());
      intakeStore.reset();
    }
  }, [generateMap]);

  return { generateMap, handleIntakeAnswers, submitPrompt };
}
