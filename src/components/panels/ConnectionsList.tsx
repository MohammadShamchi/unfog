"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

interface ConnectionsListProps {
  nodeId: string;
}

export function ConnectionsList({ nodeId }: ConnectionsListProps) {
  const edges = useCanvasStore((s) => s.edges);
  const nodes = useCanvasStore((s) => s.nodes);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const incoming = edges
    .filter((e) => e.target === nodeId)
    .map((e) => ({
      edgeId: e.id,
      nodeId: e.source,
      label: nodes.find((n) => n.id === e.source)?.data.label ?? e.source,
    }));

  const outgoing = edges
    .filter((e) => e.source === nodeId)
    .map((e) => ({
      edgeId: e.id,
      nodeId: e.target,
      label: nodes.find((n) => n.id === e.target)?.data.label ?? e.target,
    }));

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <p className="text-xs text-text-muted font-body">No connections</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {incoming.map((c) => (
        <button
          key={c.edgeId}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-body text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
          onClick={() => setSelectedNodeId(c.nodeId)}
        >
          <ArrowLeft size={12} className="shrink-0 text-text-muted" />
          <span className="truncate" dir="auto">{c.label}</span>
        </button>
      ))}
      {outgoing.map((c) => (
        <button
          key={c.edgeId}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-body text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
          onClick={() => setSelectedNodeId(c.nodeId)}
        >
          <ArrowRight size={12} className="shrink-0 text-text-muted" />
          <span className="truncate" dir="auto">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
