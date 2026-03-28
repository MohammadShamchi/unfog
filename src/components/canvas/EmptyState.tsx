"use client";

import { motion } from "framer-motion";
import { PenLine, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface EmptyStateProps {
  variant: "manual" | "guided";
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}

const EMPTY_STATE_COPY = {
  manual: {
    eyebrow: "Blank canvas ready",
    title: "Build the structure your way.",
    description:
      "Start with a node, connect ideas freely, and bring AI in once the shape starts to emerge.",
    primaryLabel: "Add first node",
    secondaryLabel: "Use AI intake instead",
    icon: PenLine,
  },
  guided: {
    eyebrow: "No map yet",
    title: "Try the guided intake again, or start from scratch.",
    description:
      "If the AI flow did not produce a map, jump back into the guided intro or switch to a blank canvas.",
    primaryLabel: "Try AI intake",
    secondaryLabel: "Start blank canvas",
    icon: Sparkles,
  },
} as const;

export function EmptyState({
  variant,
  onPrimaryAction,
  onSecondaryAction,
}: EmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const content = EMPTY_STATE_COPY[variant];
  const Icon = content.icon;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto w-full max-w-[560px] rounded-[28px] border px-6 py-6 backdrop-blur-sm md:px-7"
        style={{
          borderColor: "color-mix(in srgb, var(--accent) 14%, var(--border))",
          backgroundColor: "color-mix(in srgb, var(--bg-elevated) 90%, transparent)",
          boxShadow: "0 30px 90px -56px var(--accent-glow)",
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "var(--accent-muted)",
                color: "var(--accent)",
              }}
            >
              <Icon size={20} />
            </div>

            <div className="space-y-2">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                {content.eyebrow}
              </p>
              <h2 className="font-display text-2xl font-semibold leading-tight text-text-primary">
                {content.title}
              </h2>
              <p className="max-w-[420px] font-body text-sm leading-6 text-text-secondary">
                {content.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="flex h-11 flex-1 items-center justify-center rounded-[18px] px-4 font-display text-sm font-semibold transition-opacity hover:opacity-92"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--bg-canvas)",
              }}
            >
              {content.primaryLabel}
            </button>

            <button
              type="button"
              onClick={onSecondaryAction}
              className="flex h-11 flex-1 items-center justify-center rounded-[18px] border px-4 font-display text-sm font-semibold transition-colors hover:text-text-primary"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
              }}
            >
              {content.secondaryLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
