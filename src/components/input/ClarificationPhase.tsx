"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInputExperienceStore } from "@/stores/input-experience-store";

interface ClarificationPhaseProps {
  onAnswer: (answer: string) => void;
  showSummary: boolean;
}

export function ClarificationPhase({ onAnswer, showSummary }: ClarificationPhaseProps) {
  const userText = useInputExperienceStore((s) => s.userText);
  const conversation = useInputExperienceStore((s) => s.conversation);
  const isAiTyping = useInputExperienceStore((s) => s.isAiTyping);
  const currentAiMessage = useInputExperienceStore((s) => s.currentAiMessage);
  const typedCharIndex = useInputExperienceStore((s) => s.typedCharIndex);

  const [answerText, setAnswerText] = useState("");
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Focus answer input when AI finishes typing
  useEffect(() => {
    if (!isAiTyping && conversation.length > 0 && !showSummary) {
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  }, [isAiTyping, conversation.length, showSummary]);

  const handleAnswerSubmit = useCallback(() => {
    const trimmed = answerText.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
    setAnswerText("");
  }, [answerText, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleAnswerSubmit();
      }
    },
    [handleAnswerSubmit],
  );

  // Currently typing AI message (partial)
  const displayedAiText = currentAiMessage.slice(0, typedCharIndex);

  // Filter conversation to show completed messages
  const completedMessages = conversation;

  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto pt-[15vh]">
      <div className="relative z-10 flex w-full max-w-[680px] flex-col gap-6 px-6 pb-20">
        {/* User's original text — compressed */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 20, duration: 0.4 }}
        >
          <p
            className="line-clamp-3"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              lineHeight: 1.7,
              color: "rgba(224, 224, 224, 0.5)",
            }}
          >
            {userText}
          </p>
        </motion.div>

        {/* Breathing horizontal line */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "40%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: 1,
            backgroundColor: "#5FE0C1",
            margin: "0 auto",
            opacity: 0.6,
          }}
        />

        {/* Conversation messages */}
        <div className="flex flex-col gap-5">
          {completedMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2"
            >
              {msg.role === "assistant" && (
                <div
                  className="mt-2 flex-shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#5FE0C1",
                  }}
                />
              )}
              <p
                style={{
                  fontFamily: msg.role === "assistant" ? "var(--font-display)" : "var(--font-body)",
                  fontSize: msg.role === "assistant" ? 16 : 15,
                  lineHeight: 1.6,
                  color: msg.role === "assistant" ? "#A0A0A0" : "#E0E0E0",
                }}
              >
                {msg.content}
              </p>
            </motion.div>
          ))}

          {/* Currently typing AI message */}
          {isAiTyping && displayedAiText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2"
            >
              <div
                className="mt-2 flex-shrink-0"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#5FE0C1",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "#A0A0A0",
                }}
              >
                {displayedAiText}
                <span className="inline-block animate-pulse">|</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Answer input — shown when AI is done and not showing summary */}
        <AnimatePresence>
          {!isAiTyping && !showSummary && conversation.length > 0 && conversation[conversation.length - 1].role === "assistant" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <textarea
                ref={answerRef}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                spellCheck={false}
                placeholder="Your answer..."
                className="w-full resize-none bg-transparent outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#E0E0E0",
                  caretColor: "#5FE0C1",
                  border: "none",
                  padding: 0,
                  minHeight: "1.6em",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary line */}
        <AnimatePresence>
          {showSummary && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                color: "#5FE0C1",
                marginTop: 8,
              }}
            >
              okay — let me show you what I&apos;m seeing
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
