"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BreathingDot } from "./BreathingDot";
import { useInputExperienceStore } from "@/stores/input-experience-store";

const PLACEHOLDERS = [
  "What's been on your mind?",
  "Describe the situation...",
  "What are you trying to figure out?",
  "Tell me what's going on...",
];

export function InvitationPhase() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userText = useInputExperienceStore((s) => s.userText);
  const setUserText = useInputExperienceStore((s) => s.setUserText);

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
      if (!hasTyped && val.length > 0) setHasTyped(true);

      // Auto-resize
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, window.innerHeight * 0.6)}px`;
    },
    [setUserText, hasTyped],
  );

  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(95,224,193,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[680px] flex-col items-center gap-4 px-6">
        {/* Breathing dot */}
        <AnimatePresence>
          <BreathingDot visible={!hasTyped} />
        </AnimatePresence>

        {/* Textarea container */}
        <div className="relative w-full">
          {/* Placeholder */}
          <AnimatePresence>
            {!hasTyped && (
              <motion.span
                key={placeholderIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute left-0 top-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: "#E0E0E0",
                }}
              >
                {PLACEHOLDERS[placeholderIndex]}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Invisible textarea */}
          <textarea
            ref={textareaRef}
            value={userText}
            onChange={handleChange}
            rows={1}
            spellCheck={false}
            className="w-full resize-none bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 18,
              lineHeight: 1.7,
              color: "#E0E0E0",
              caretColor: "#5FE0C1",
              border: "none",
              padding: 0,
              minHeight: "1.7em",
            }}
          />
        </div>
      </div>
    </div>
  );
}
