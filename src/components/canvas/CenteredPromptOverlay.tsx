"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useIntakeHandler } from "@/hooks/use-intake-handler";
import { useHistoryStore } from "@/stores/history-store";
import { useIntakeStore } from "@/stores/intake-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { formatRelativeTime } from "@/lib/utils";

export function CenteredPromptOverlay() {
  const [prompt, setPrompt] = useState("");
  const { submitPrompt } = useIntakeHandler();

  const isLoading = useCanvasStore((s) => s.isLoading);
  const intakeStatus = useIntakeStore((s) => s.status);
  const history = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);

  const isDisabled = !prompt.trim() || isLoading || intakeStatus === "assessing" || intakeStatus === "asking" || intakeStatus === "answering";
  const isProcessing = isLoading || intakeStatus === "assessing";

  function handleSubmit() {
    if (isDisabled) return;
    submitPrompt(prompt);
  }

  const recentHistory = history.slice(0, 5);

  return (
    <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-[560px] flex-col gap-6 px-6"
      >
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary mb-1">
            Describe your problem
          </h2>
          <p className="text-sm text-text-muted font-body">
            Write anything — in any language. AI will map it.
          </p>
        </div>

        <Textarea
          placeholder="I run a software company. Sales are bad, HR is a mess, and we're not shipping fast enough..."
          className="min-h-[180px] resize-none border-border bg-elevated text-text-primary placeholder:text-text-muted font-body text-sm focus:border-accent focus:ring-1 focus:ring-accent-glow"
          style={{
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-elevated)",
          }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
          autoFocus
        />

        <Button
          className="w-full gap-2 font-display text-sm font-semibold"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--bg-canvas)",
            borderRadius: "var(--radius-sm)",
          }}
          disabled={isDisabled}
          onClick={handleSubmit}
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isProcessing ? "Analyzing..." : "Unfog this"}
        </Button>

        {recentHistory.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div>
              <h3 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Recent
              </h3>
              <div className="space-y-2">
                {recentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative rounded-md border p-2.5 cursor-pointer transition-colors hover:border-text-muted"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg-elevated)",
                    }}
                    onClick={() => submitPrompt(entry.prompt)}
                  >
                    <p className="font-body text-xs text-text-primary line-clamp-2 pr-5">
                      {entry.prompt}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted font-body">
                      <span>{formatRelativeTime(entry.timestamp)}</span>
                      <span>&middot;</span>
                      <span>{entry.nodeCount} nodes</span>
                    </div>
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntry(entry.id);
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
