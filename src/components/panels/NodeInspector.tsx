"use client";

import { useState } from "react";
import { Loader2, Search, Trash2, Copy, Unlink, Focus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";
import { EditableText } from "@/components/canvas/EditableText";
import { NODE_COLORS, NODE_TYPE_LABELS } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";
import { ConnectionsList } from "./ConnectionsList";
import { CanvasChat } from "./CanvasChat";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { soundEngine } from "@/lib/sound/sound-engine";

const NODE_TYPES: NodeType[] = ["problem", "cause", "solution", "context"];

export function NodeInspector() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const originalPrompt = useCanvasStore((s) => s.originalPrompt);
  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);

  const [isExploring, setIsExploring] = useState(false);
  const [exploreThrottled, setExploreThrottled] = useState(false);

  const node = nodes.find((n) => n.id === selectedNodeId);
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

  const handleExplore = async () => {
    if (isExploring || exploreThrottled) return;

    setIsExploring(true);
    setExploreThrottled(true);
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

      const res = await fetchWithRetry("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: selectedNodeId,
          nodeLabel: node.data.label,
          nodeDescription: node.data.description,
          nodeType: node.data.nodeType,
          originalPrompt,
          currentNodes,
          currentEdges,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Explore failed");
        return;
      }

      useCanvasStore.getState().applyExploreResult(
        selectedNodeId,
        data.data.nodes,
        data.data.edges
      );
      soundEngine.playExplore();
    } catch {
      toast.error("Explore request failed.");
    } finally {
      setIsExploring(false);
      setTimeout(() => setExploreThrottled(false), 3000);
    }
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
                backgroundColor: node.data.nodeType === t ? `${NODE_COLORS[t]}20` : "transparent",
                color: node.data.nodeType === t ? NODE_COLORS[t] : "var(--text-muted)",
                border: node.data.nodeType === t ? `1px solid ${NODE_COLORS[t]}40` : "1px solid transparent",
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

      {/* Explore */}
      <div className="px-5 py-3">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 font-display text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
            borderRadius: "var(--radius-sm)",
          }}
          disabled={isExploring || exploreThrottled}
          onClick={handleExplore}
        >
          {isExploring ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {isExploring ? "Exploring..." : "Explore this deeper"}
        </button>
      </div>

      {/* Focus toggle */}
      <div className="px-5 pb-3">
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
