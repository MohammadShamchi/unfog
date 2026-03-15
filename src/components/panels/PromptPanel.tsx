"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { useIntakeStore } from "@/stores/intake-store";
import { IntakeTrail } from "./IntakeTrail";
import { useIntakeHandler } from "@/hooks/use-intake-handler";
import { soundEngine } from "@/lib/sound/sound-engine";
import { formatEditHistory } from "@/lib/format-edit-history";
import { formatRelativeTime } from "@/lib/utils";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

export function PromptPanelContent() {
  const [prompt, setPrompt] = useState("");
  const [editsExpanded, setEditsExpanded] = useState(false);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const editHistory = useCanvasStore((s) => s.editHistory);
  const originalPrompt = useCanvasStore((s) => s.originalPrompt);
  const isRefining = useCanvasStore((s) => s.isRefining);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const summary = useCanvasStore((s) => s.summary);

  const history = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  // Intake state
  const intakeStatus = useIntakeStore((s) => s.status);
  const intakeRounds = useIntakeStore((s) => s.rounds);

  const { generateMap, submitPrompt } = useIntakeHandler();

  function handleSubmit(overridePrompt?: string) {
    const text = overridePrompt ?? prompt;
    if (!text.trim() || isLoading) return;
    submitPrompt(text);
  }

  async function handleRefine() {
    if (editHistory.length === 0 || isRefining) return;

    useCanvasStore.getState().setRefining(true);
    soundEngine.playAiStart();
    try {
      const currentNodes = nodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        label: n.data.label,
        description: n.data.description,
      }));
      const currentEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      }));

      const res = await fetchWithRetry("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPrompt,
          currentNodes,
          currentEdges,
          editHistory,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Re-analysis failed");
        return;
      }

      useCanvasStore.getState().applyRefinement(data.data);
      soundEngine.playAiComplete();
      toast.success("Map updated by AI");
    } catch {
      toast.error("Re-analysis request failed.");
    } finally {
      useCanvasStore.getState().setRefining(false);
    }
  }

  const editSummaryLines = editHistory.length > 0
    ? formatEditHistory(editHistory).split("\n")
    : [];

  return (
    <div className="flex h-full flex-col">
      {/* Input section */}
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-sm font-semibold text-text-primary mb-1">
            Describe your problem
          </h2>
          <p className="text-xs text-text-muted font-body">
            Write anything — in any language. AI will map it.
          </p>
        </div>

        <Textarea
          placeholder="I run a software company. Sales are bad, HR is a mess, and we're not shipping fast enough..."
          className="min-h-[140px] resize-none border-border bg-elevated text-text-primary placeholder:text-text-muted font-body text-sm focus:border-accent focus:ring-1 focus:ring-accent-glow"
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
        />

        <Button
          className="w-full gap-2 font-display text-sm font-semibold"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--bg-canvas)",
            borderRadius: "var(--radius-sm)",
          }}
          disabled={!prompt.trim() || isLoading || intakeStatus === "assessing" || intakeStatus === "asking" || intakeStatus === "answering"}
          onClick={() => handleSubmit()}
        >
          {isLoading || intakeStatus === "assessing" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isLoading || intakeStatus === "assessing" ? "Analyzing..." : "Unfog this"}
        </Button>
      </div>

      {/* Summary card */}
      {summary && nodes.length > 0 && (
        <div className="px-5 pb-4">
          <div
            className="rounded-md p-3"
            style={{ backgroundColor: "var(--accent-muted)" }}
          >
            <p className="text-xs font-semibold font-display" style={{ color: "var(--accent)" }}>
              Summary
            </p>
            <p className="mt-1 text-xs font-body text-text-secondary">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Intake trail — shows conversation path (only after map generation) */}
      {intakeRounds.length > 0 && nodes.length > 0 && (
        <div className="px-5 pb-4">
          <IntakeTrail />
        </div>
      )}

      {/* Re-analyze section */}
      {nodes.length > 0 && editHistory.length > 0 && (
        <div className="px-5 pb-4">
          <div
            className="rounded-md border p-3"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-elevated)",
            }}
          >
            <button
              className="flex w-full items-center justify-between text-xs font-body text-text-secondary"
              onClick={() => setEditsExpanded(!editsExpanded)}
            >
              <span>{editHistory.length} change{editHistory.length !== 1 ? "s" : ""} made</span>
              {editsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {editsExpanded && (
              <ul className="mt-2 space-y-1">
                {editSummaryLines.map((line, i) => (
                  <li key={i} className="text-[11px] font-body text-text-muted">
                    {line}
                  </li>
                ))}
              </ul>
            )}

            <Button
              className="mt-3 w-full gap-2 font-display text-xs font-semibold"
              variant="outline"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
                borderRadius: "var(--radius-sm)",
              }}
              disabled={isRefining}
              onClick={handleRefine}
            >
              {isRefining ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {isRefining ? "Re-analyzing..." : "Re-analyze"}
            </Button>
          </div>
        </div>
      )}

      {/* Divider */}
      <div
        className="mx-5"
        style={{ borderTop: "1px solid var(--border)" }}
      />

      {/* History section */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">
            History
          </h3>
          {history.length > 0 && (
            <button
              className="text-[10px] font-body text-text-muted hover:text-red-400 transition-colors"
              onClick={() => {
                if (window.confirm("Clear all history?")) clearHistory();
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-text-muted font-body">
            Previous prompts will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="group relative rounded-md border p-2.5 cursor-pointer transition-colors hover:border-text-muted"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-elevated)",
                }}
                onClick={() => {
                  setPrompt(entry.prompt);
                  handleSubmit(entry.prompt);
                }}
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
        )}
      </div>
    </div>
  );
}

export function PromptPanel() {
  return (
    <aside
      className="flex flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <PromptPanelContent />
    </aside>
  );
}
