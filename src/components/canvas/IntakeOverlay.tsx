"use client";

import { motion } from "framer-motion";
import { useIntakeStore } from "@/stores/intake-store";
import { useIntakeHandler } from "@/hooks/use-intake-handler";
import { IntakeTrail } from "@/components/panels/IntakeTrail";
import { IntakeQuestions } from "@/components/panels/IntakeQuestions";

export function IntakeOverlay() {
  const status = useIntakeStore((s) => s.status);
  const rounds = useIntakeStore((s) => s.rounds);
  const currentQuestions = rounds[rounds.length - 1]?.questions;
  const { handleIntakeAnswers } = useIntakeHandler();

  const showTrail = rounds.length > 0 && rounds[0].answers.length > 0;

  return (
    <motion.div
      key="intake"
      className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-[600px] flex-col overflow-y-auto rounded-lg border p-6"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        {status === "assessing" && (
          <div className="flex items-center gap-2 py-4">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <p className="text-xs text-text-muted font-body">
              Analyzing your input...
            </p>
          </div>
        )}

        {(status === "asking" || status === "answering") && (
          <>
            {showTrail && (
              <>
                <IntakeTrail />
                <div
                  className="my-4"
                  style={{ borderTop: "1px solid var(--border)" }}
                />
              </>
            )}

            {currentQuestions && (
              <IntakeQuestions
                key={rounds.length}
                questions={currentQuestions}
                onSubmit={handleIntakeAnswers}
                isSubmitting={status === "answering"}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
