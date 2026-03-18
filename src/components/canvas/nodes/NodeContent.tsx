"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { soundEngine } from "@/lib/sound/sound-engine";
import { EditableText } from "../EditableText";
import { TypeBadge } from "../TypeBadge";
import { NodeToolbar } from "../NodeToolbar";
import type { NodeType } from "@/types/analysis";
import type { InsightNodeData } from "@/types/canvas";

interface NodeContentProps {
  nodeId: string;
  data: InsightNodeData;
  color: string;
  onEditStart: () => void;
  onEditEnd: () => void;
}

export function NodeContent({ nodeId, data, color, onEditStart, onEditEnd }: NodeContentProps) {
  const onLabelCommit = useCallback(
    (newLabel: string) => {
      useCanvasStore.getState().updateNodeData(nodeId, { label: newLabel });
    },
    [nodeId],
  );

  const onDescriptionCommit = useCallback(
    (newDesc: string) => {
      useCanvasStore.getState().updateNodeData(nodeId, { description: newDesc });
    },
    [nodeId],
  );

  const onTypeChange = useCallback(
    (newType: NodeType) => {
      useCanvasStore.getState().changeNodeType(nodeId, newType);
      soundEngine.playTypeChange();
    },
    [nodeId],
  );

  return (
    <>
      {/* Toolbar on hover */}
      <div className="absolute -top-8 right-0 opacity-0 transition-opacity group-hover:opacity-100 z-10">
        <NodeToolbar nodeId={nodeId} />
      </div>

      {/* Type badge */}
      <div className="mb-1.5" style={{ opacity: 0.7 }}>
        <TypeBadge nodeType={data.nodeType} onChange={onTypeChange} />
      </div>

      {/* Editable label */}
      <EditableText
        value={data.label}
        onCommit={onLabelCommit}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
        className="font-display text-sm font-semibold text-text-primary"
      />

      {/* Editable description */}
      <EditableText
        value={data.description}
        onCommit={onDescriptionCommit}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
        multiline
        className="mt-1 font-body text-xs text-text-secondary leading-relaxed line-clamp-2"
      />
    </>
  );
}
