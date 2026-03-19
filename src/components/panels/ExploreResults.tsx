"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { NODE_BADGE_STYLES, NODE_TYPE_LABELS } from "@/types/canvas";
import type { OptionsResponse, OptionNode } from "@/types/analysis";

interface ExploreResultsProps {
  results: OptionsResponse | null;
  isLoading: boolean;
  onAddToMap: (optionId: string) => void;
  onDismiss: (optionId: string) => void;
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      className="rounded-lg p-3.5"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <div className="mb-2.5 h-4 w-20 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
      <div className="mb-1.5 h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
      <div className="mb-3 h-3 w-full rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
      <div className="mb-1.5 h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
      <div className="mb-1.5 h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
      <div className="h-3 w-1/3 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
    </motion.div>
  );
}

function OptionCard({
  option,
  risk,
  index,
  onAddToMap,
  onDismiss,
}: {
  option: OptionNode;
  risk: OptionNode | undefined;
  index: number;
  onAddToMap: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const badge = NODE_BADGE_STYLES[option.type];

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ backgroundColor: badge.text }}
      />

      <div className="pl-3.5 pr-3 py-3">
        {/* Type badge + Alternative tag */}
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {NODE_TYPE_LABELS[option.type]}
          </span>
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-display font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Alternative
          </span>
        </div>

        {/* Label */}
        <p dir="auto" className="font-display text-sm font-semibold text-text-primary">
          {option.label}
        </p>

        {/* Description */}
        <p dir="auto" className="mt-1 font-body text-xs text-text-secondary leading-relaxed">
          {option.description}
        </p>

        {/* Actions */}
        <div className="mt-2.5 flex items-center gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs font-semibold transition-all"
            style={{
              backgroundColor: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={() => onAddToMap(option.id)}
          >
            <Plus size={12} />
            Add to map
          </button>
          <button
            className="flex items-center justify-center rounded-md p-1.5 text-text-muted transition-colors hover:text-text-secondary"
            style={{ backgroundColor: "transparent" }}
            onClick={() => onDismiss(option.id)}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ExploreResults({ results, isLoading, onAddToMap, onDismiss }: ExploreResultsProps) {
  if (!isLoading && !results) return null;

  const positiveOptions = results?.options.filter((o) => o.sentiment === "positive") ?? [];

  if (!isLoading && positiveOptions.length === 0) return null;

  return (
    <div className="mt-2.5 max-h-[400px] overflow-y-auto flex flex-col gap-2.5">
      <AnimatePresence mode="popLayout">
        {isLoading && !results && (
          <>
            <SkeletonCard key="skel-0" delay={0} />
            <SkeletonCard key="skel-1" delay={0.08} />
          </>
        )}
        {positiveOptions.map((option, i) => {
          const risk = results?.options.find(
            (o) => o.sentiment === "negative" && o.parentOptionId === option.id
          );
          return (
            <OptionCard
              key={option.id}
              option={option}
              risk={risk}
              index={i}
              onAddToMap={onAddToMap}
              onDismiss={onDismiss}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
