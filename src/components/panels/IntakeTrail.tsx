"use client";

import { motion } from "framer-motion";
import { MessageCircle, Check } from "lucide-react";
import { useIntakeStore } from "@/stores/intake-store";

export function IntakeTrail() {
  const rounds = useIntakeStore((s) => s.rounds);

  if (rounds.length === 0) return null;

  // Flatten all Q&A pairs into a linear trail
  const trail: Array<{
    type: "question" | "answer";
    text: string;
    roundIndex: number;
  }> = [];

  for (let ri = 0; ri < rounds.length; ri++) {
    const round = rounds[ri];
    for (let qi = 0; qi < round.questions.length; qi++) {
      trail.push({
        type: "question",
        text: round.questions[qi].question,
        roundIndex: ri,
      });
      if (round.answers[qi]) {
        trail.push({
          type: "answer",
          text: round.answers[qi].answer,
          roundIndex: ri,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-0 relative">
      {/* Vertical line */}
      <div
        className="absolute left-[11px] top-3 bottom-3 w-px"
        style={{ backgroundColor: "var(--border)" }}
      />

      {trail.map((item, i) => (
        <motion.div
          key={`${item.type}-${i}`}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 py-1.5 relative"
        >
          {/* Dot on the line */}
          <div
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 z-10"
            style={{
              backgroundColor:
                item.type === "question"
                  ? "var(--bg-surface)"
                  : "var(--accent-muted)",
              border: `1px solid ${
                item.type === "question"
                  ? "var(--border)"
                  : "var(--accent)"
              }`,
            }}
          >
            {item.type === "question" ? (
              <MessageCircle size={10} className="text-text-muted" />
            ) : (
              <Check size={10} className="text-accent" />
            )}
          </div>

          {/* Text */}
          <p
            className="text-xs font-body leading-relaxed pt-0.5"
            style={{
              color:
                item.type === "question"
                  ? "var(--text-secondary)"
                  : "var(--text-primary)",
              fontWeight: item.type === "answer" ? 500 : 400,
            }}
          >
            {item.text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}