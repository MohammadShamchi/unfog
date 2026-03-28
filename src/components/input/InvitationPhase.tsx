"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Sparkles } from "lucide-react";
import { BreathingDot } from "./BreathingDot";
import { useInputExperienceStore } from "@/stores/input-experience-store";
import { Button } from "@/components/ui/button";

const PLACEHOLDERS = [
  "What's been on your mind?",
  "Describe the situation...",
  "What are you trying to figure out?",
  "Tell me what's going on...",
];

interface InvitationPhaseProps {
  onStartAi: () => void;
}

export function InvitationPhase({ onStartAi }: InvitationPhaseProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userText = useInputExperienceStore((s) => s.userText);
  const setUserText = useInputExperienceStore((s) => s.setUserText);
  const startManualCanvas = useInputExperienceStore((s) => s.startManualCanvas);

  const [hasTyped, setHasTyped] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholders
  useEffect(() => {
    if (hasTyped) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hasTyped]);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Auto-expand textarea
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setUserText(val);
      setHasTyped(val.length > 0);

      // Auto-resize
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, window.innerHeight * 0.6)}px`;
    },
    [setUserText],
  );

  return (
    <div className="flex h-full w-full items-center justify-center px-6 py-12">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 flex w-full max-w-[760px] flex-col gap-6 rounded-[28px] border px-6 py-7 backdrop-blur-sm md:px-8"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
          borderColor: "color-mix(in srgb, var(--border) 78%, transparent)",
          boxShadow: "0 30px 90px -50px var(--accent-glow)",
        }}
      >
        <div className="flex flex-col items-start gap-3">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.18em]"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 28%, transparent)",
              backgroundColor: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            <BreathingDot visible={!hasTyped} />
            Start your way
          </div>

          <div className="space-y-3">
            <h1 className="max-w-[540px] font-display text-3xl font-semibold leading-tight text-text-primary md:text-[2.55rem]">
              Talk it through with AI, or sketch the structure yourself.
            </h1>
            <p className="max-w-[560px] font-body text-sm leading-6 text-text-secondary md:text-base">
              If you want help untangling the problem first, AI will ask a few sharp questions.
              If you already know the shape, start with a blank canvas and build it by hand.
            </p>
          </div>
        </div>

        <div
          className="relative rounded-[22px] border px-4 py-4 md:px-5 md:py-5"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 18%, var(--border))",
            backgroundColor: "color-mix(in srgb, var(--bg-surface) 66%, transparent)",
          }}
        >
          <AnimatePresence>
            {!hasTyped && (
              <motion.span
                key={placeholderIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.52 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute left-4 top-4 md:left-5 md:top-5"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: "var(--text-muted)",
                }}
              >
                {PLACEHOLDERS[placeholderIndex]}
              </motion.span>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={userText}
            onChange={handleChange}
            rows={5}
            spellCheck={false}
            className="w-full resize-none bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 18,
              lineHeight: 1.7,
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
              border: "none",
              padding: 0,
              minHeight: "9rem",
            }}
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <Button
            onClick={onStartAi}
            disabled={!userText.trim()}
            className="h-12 flex-1 justify-center gap-2 rounded-[18px] font-display text-sm font-semibold"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--bg-canvas)",
            }}
          >
            <Sparkles size={16} />
            Clarify with AI
          </Button>

          <button
            type="button"
            onClick={startManualCanvas}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] border px-4 font-display text-sm font-semibold transition-colors hover:text-text-primary"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
            }}
          >
            <PenLine size={16} />
            Start blank canvas
          </button>
        </div>

        <p className="font-body text-xs leading-5 text-text-muted">
          Press Cmd/Ctrl + Enter to start the AI path. Manual mode keeps the canvas clean and lets
          you bring AI in later.
        </p>
      </div>
    </div>
  );
}
