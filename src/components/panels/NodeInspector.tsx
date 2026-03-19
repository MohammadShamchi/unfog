"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Search, Trash2, Copy, Unlink, Focus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";
import { EditableText } from "@/components/canvas/EditableText";
import { NODE_BADGE_STYLES, NODE_TYPE_LABELS } from "@/types/canvas";
import type { NodeType, OptionsResponse } from "@/types/analysis";
import { ConnectionsList } from "./ConnectionsList";
import { CanvasChat } from "./CanvasChat";
import { ExploreResults } from "./ExploreResults";
import { apiPost } from "@/lib/api-client";
import { soundEngine } from "@/lib/sound/sound-engine";

const NODE_TYPES: NodeType[] = ["problem", "cause", "idea", "solution", "context"];

export function NodeInspector() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const originalPrompt = useCanvasStore((s) => s.originalPrompt);
  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);

  const [isExploring, setIsExploring] = useState(false);
  const [exploreResults, setExploreResults] = useState<OptionsResponse | null>(null);
  const exploreCache = useRef<Map<string, OptionsResponse>>(new Map());

  // Clear explore results when selected node changes (cache persists)
  useEffect(() => {
    setExploreResults(null);
    setIsExploring(false);
  }, [selectedNodeId]);

  const node = nodes.find((n) => n.id === selectedNodeId);

  const handleExplore = useCallback(async () => {
    if (isExploring || !selectedNodeId) return;

    // Check cache first (does not require `node` in the current render)
    const cached = exploreCache.current.get(selectedNodeId);
    if (cached) {
      setExploreResults(cached);
      return;
    }

    if (!node) return;

    setIsExploring(true);
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

      const res = await apiPost("/api/options", {
        nodeId: selectedNodeId,
        nodeLabel: node.data.label,
        nodeDescription: node.data.description,
        nodeType: node.data.nodeType,
        originalPrompt,
        currentNodes,
        currentEdges,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Explore failed");
        return;
      }

      if (data.data?.options?.length > 0) {
        const result: OptionsResponse = data.data;
        exploreCache.current.set(selectedNodeId, result);
        setExploreResults(result);
        soundEngine.playOptionsReady();
      }
    } catch {
      toast.error("Explore request failed.");
    } finally {
      setIsExploring(false);
    }
  }, [isExploring, selectedNodeId, nodes, edges, node, originalPrompt]);

  const handleAddToMap = useCallback((optionId: string) => {
    if (!exploreResults || !selectedNodeId) return;

    const option = exploreResults.options.find((o) => o.id === optionId);
    if (!option) return;

    // Collect option + its risk children
    const riskChildren = exploreResults.options.filter((o) => o.parentOptionId === optionId);
    const nodesToAdd = [option, ...riskChildren];
    const nodeIds = new Set(nodesToAdd.map((n) => n.id));
    nodeIds.add(selectedNodeId);
    const edgesToAdd = exploreResults.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    // Remap opt_* IDs to node_N
    const canvasState = useCanvasStore.getState();
    const maxN = canvasState.nodes.reduce((max, n) => {
      const match = n.id.match(/^node_(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const idMap = new Map<string, string>();
    nodesToAdd.forEach((n, i) => {
      idMap.set(n.id, `node_${maxN + 1 + i}`);
    });

    const remappedNodes = nodesToAdd.map((n) => ({
      id: idMap.get(n.id)!,
      type: n.type,
      label: n.label,
      description: n.description,
    }));

    const remappedEdges = edgesToAdd.map((e) => ({
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      label: e.label,
    }));

    canvasState.applyExploreResult(selectedNodeId, remappedNodes, remappedEdges);
    soundEngine.playNodeCreate();

    // Remove accepted option + its risks from results
    const removeIds = new Set(nodesToAdd.map((n) => n.id));
    setExploreResults((prev) => {
      if (!prev) return null;
      const newOptions = prev.options.filter((o) => !removeIds.has(o.id));
      const newEdges = prev.edges.filter(
        (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
      );
      const updated = { options: newOptions, edges: newEdges };
      // Update cache too
      exploreCache.current.set(selectedNodeId, updated);
      return newOptions.some((o) => o.sentiment === "positive") ? updated : null;
    });
  }, [exploreResults, selectedNodeId]);

  const handleDismissOption = useCallback((optionId: string) => {
    if (!exploreResults || !selectedNodeId) return;

    const removeIds = new Set([optionId]);
    exploreResults.options
      .filter((o) => o.parentOptionId === optionId)
      .forEach((o) => removeIds.add(o.id));

    setExploreResults((prev) => {
      if (!prev) return null;
      const newOptions = prev.options.filter((o) => !removeIds.has(o.id));
      const newEdges = prev.edges.filter(
        (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
      );
      const updated = { options: newOptions, edges: newEdges };
      exploreCache.current.set(selectedNodeId, updated);
      return newOptions.some((o) => o.sentiment === "positive") ? updated : null;
    });
  }, [exploreResults, selectedNodeId]);

  if (!node || !selectedNodeId) return null;

  const handleLabelCommit = (newLabel: string) => {
    useCanvasStore.getState().updateNodeData(selectedNodeId, { label: newLabel });
  };

  const handleDescriptionCommit = (newDesc: string) => {
    useCanvasStore.getState().updateNodeData(selectedNodeId, { description: newDesc });
  };

  const handleTypeChange = (newType: NodeType) => {
    useCanvasStore.getState().changeNodeType(selectedNodeId, newType);
    soundEngine.playTypeChange();
  };

  const handleDelete = () => {
    const result = useCanvasStore.getState().deleteNode(selectedNodeId);
    if (result) {
      toast("Node deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            useCanvasStore.getState().restoreNode(result.node, result.edges);
          },
        },
        duration: 3000,
      });
    }
  };

  const handleDuplicate = () => {
    useCanvasStore.getState().duplicateNode(selectedNodeId);
    soundEngine.playNodeCreate();
  };

  const handleDisconnect = () => {
    useCanvasStore.getState().disconnectNode(selectedNodeId);
  };

  const isFocused = focusedNodeId === selectedNodeId;

  const handleFocusToggle = () => {
    if (isFocused) {
      useFocusStore.getState().exitFocus();
    } else {
      useFocusStore.getState().enterFocus(selectedNodeId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-5 pb-3">
        {/* Type badge row */}
        <div className="flex items-center gap-1 mb-3">
          {NODE_TYPES.map((t) => (
            <button
              key={t}
              className="rounded-sm px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wider transition-opacity"
              style={{
                backgroundColor: node.data.nodeType === t ? NODE_BADGE_STYLES[t].bg : "transparent",
                color: node.data.nodeType === t ? NODE_BADGE_STYLES[t].text : "var(--text-muted)",
                border: node.data.nodeType === t ? `1px solid ${NODE_BADGE_STYLES[t].text}` : "1px solid transparent",
              }}
              onClick={() => handleTypeChange(t)}
            >
              {NODE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Editable label */}
        <EditableText
          value={node.data.label}
          onCommit={handleLabelCommit}
          className="font-display text-sm font-semibold text-text-primary"
        />

        {/* Editable description */}
        <EditableText
          value={node.data.description}
          onCommit={handleDescriptionCommit}
          multiline
          className="mt-1.5 font-body text-xs text-text-secondary leading-relaxed"
        />
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid var(--border)" }} />

      {/* Explore — shrink-0 so flex layout does not compress cards into each other */}
      <div className="shrink-0 px-5 py-3">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 font-display text-xs font-semibold transition-all disabled:opacity-50 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          style={{
            backgroundColor: isExploring ? "var(--accent-muted)" : "transparent",
            color: isExploring ? "var(--accent)" : "var(--text-secondary)",
            border: `1px solid ${isExploring ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
          }}
          disabled={isExploring}
          onClick={handleExplore}
        >
          {isExploring ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {isExploring ? "Exploring..." : "Explore this deeper"}
        </button>
        <ExploreResults
          results={exploreResults}
          isLoading={isExploring}
          onAddToMap={handleAddToMap}
          onDismiss={handleDismissOption}
        />
      </div>

      {/* Focus toggle */}
      <div className="shrink-0 px-5 pb-3 pt-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 font-display text-xs font-semibold transition-all"
          style={{
            backgroundColor: isFocused ? "var(--accent-muted)" : "transparent",
            color: isFocused ? "var(--accent)" : "var(--text-secondary)",
            border: `1px solid ${isFocused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
          }}
          onClick={handleFocusToggle}
        >
          {isFocused ? <XCircle size={14} /> : <Focus size={14} />}
          {isFocused ? "Exit focus" : "Focus on this branch"}
        </button>
      </div>

      {/* Chat */}
      <div className="px-5 pb-3 flex-1 min-h-0">
        <CanvasChat selectedNodeId={selectedNodeId} />
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid var(--border)" }} />

      {/* Connections */}
      <div className="px-5 py-3">
        <h3 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Connections
        </h3>
        <ConnectionsList nodeId={selectedNodeId} />
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid var(--border)" }} />

      {/* Quick Actions */}
      <div className="px-5 py-3">
        <h3 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Actions
        </h3>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-body text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
            onClick={handleDuplicate}
          >
            <Copy size={13} /> Duplicate
          </button>
          <button
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-body text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
            onClick={handleDisconnect}
          >
            <Unlink size={13} /> Disconnect
          </button>
          <button
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-body text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
            onClick={handleDelete}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
