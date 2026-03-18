"use client";

import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InvitationPhase } from "./InvitationPhase";
import { ClarificationPhase } from "./ClarificationPhase";
import { RevealOverlay } from "./RevealOverlay";
import { FogParticles } from "./FogParticles";
import { useInputExperienceStore } from "@/stores/input-experience-store";
import { useInputExperience } from "@/hooks/use-input-experience";

export function InputExperience() {
  const phase = useInputExperienceStore((s) => s.phase);
  const userText = useInputExperienceStore((s) => s.userText);
  const fogDirection = useInputExperienceStore((s) => s.fogDirection);

  const { handleAnswer, handleSubmitShortcut } = useInputExperience();

  // Fog activation: 3+ lines of text
  const lineCount = userText.split("\n").length;
  const fogActive = lineCount >= 3 || phase === "clarification" || phase === "reveal";

  // Global keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmitShortcut();
      }
    },
    [handleSubmitShortcut],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div
      className="absolute inset-0 z-30"
      style={{ backgroundColor: "#0B0D10" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <FogParticles
        active={fogActive}
        direction={fogDirection === "none" ? (phase === "invitation" ? "inward" : "outward") : fogDirection}
      />

      <AnimatePresence mode="wait">
        {phase === "invitation" && (
          <motion.div
            key="invitation"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InvitationPhase />
          </motion.div>
        )}

        {phase === "clarification" && (
          <motion.div
            key="clarification"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClarificationPhase
              onAnswer={handleAnswer}
              showSummary={false}
            />
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <RevealOverlay />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
