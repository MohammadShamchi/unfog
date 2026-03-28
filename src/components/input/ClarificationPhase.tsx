"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, CornerDownLeft } from "lucide-react";
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
      if (e.key === "Enter" && !e.shiftKey) {
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
              color: "var(--text-secondary)",
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
            backgroundColor: "var(--accent)",
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
                    backgroundColor: "var(--accent)",
                  }}
                />
              )}
              <p
                style={{
                  fontFamily: msg.role === "assistant" ? "var(--font-display)" : "var(--font-body)",
                  fontSize: msg.role === "assistant" ? 16 : 15,
                  lineHeight: 1.6,
                  color: msg.role === "assistant" ? "var(--text-secondary)" : "var(--text-primary)",
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
                  backgroundColor: "var(--accent)",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
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
              className="rounded-[20px] border px-4 py-3"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 16%, var(--border))",
                backgroundColor: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)",
              }}
            >
              <textarea
                ref={answerRef}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                spellCheck={false}
                placeholder="Answer in your own words..."
                className="w-full resize-none bg-transparent outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  caretColor: "var(--accent)",
                  border: "none",
                  padding: 0,
                  minHeight: "3.2em",
                }}
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <CornerDownLeft size={12} />
                  <span>Enter sends. Shift + Enter adds a new line.</span>
                </div>

                <button
                  type="button"
                  onClick={handleAnswerSubmit}
                  disabled={!answerText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-semibold transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--bg-canvas)",
                  }}
                >
                  Send
                  <ArrowUpRight size={13} />
                </button>
              </div>
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
                color: "var(--accent)",
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
