"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { InsightNode as InsightNodeType } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";
import { NODE_COLORS } from "@/types/canvas";
import { useCanvasStore } from "@/stores/canvas-store";
import { soundEngine } from "@/lib/sound/sound-engine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EditableText } from "./EditableText";
import { TypeBadge } from "./TypeBadge";
import { NodeToolbar } from "./NodeToolbar";

function InsightNodeComponent({ id, data }: NodeProps<InsightNodeType>) {
  const borderColor = NODE_COLORS[data.nodeType];
  const reducedMotion = useReducedMotion();
  const delay = data.animationDelay ?? 0;

  const onLabelCommit = useCallback(
    (newLabel: string) => {
      useCanvasStore.getState().updateNodeData(id, { label: newLabel });
    },
    [id]
  );

  const onDescriptionCommit = useCallback(
    (newDesc: string) => {
      useCanvasStore.getState().updateNodeData(id, { description: newDesc });
    },
    [id]
  );

  const onTypeChange = useCallback(
    (newType: NodeType) => {
      useCanvasStore.getState().changeNodeType(id, newType);
      soundEngine.playTypeChange();
    },
    [id]
  );

  const duration = reducedMotion ? 0 : 0.35;

  return (
    <motion.div
      className="group relative min-w-[200px] max-w-[280px] rounded-md border bg-elevated px-3 py-2.5"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border)",
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={reducedMotion ? {} : { scale: 1.02, transition: { duration: 0.12 } }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-hover)";
        el.style.borderLeftColor = borderColor;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.borderLeftColor = borderColor;
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {/* Toolbar on hover */}
      <div className="absolute -top-8 right-0 opacity-0 transition-opacity group-hover:opacity-100">
        <NodeToolbar nodeId={id} />
      </div>

      {/* Type badge */}
      <div className="mb-1.5">
        <TypeBadge nodeType={data.nodeType} onChange={onTypeChange} />
      </div>

      {/* Editable label */}
      <EditableText
        value={data.label}
        onCommit={onLabelCommit}
        className="font-display text-sm font-semibold text-text-primary"
      />

      {/* Editable description */}
      <EditableText
        value={data.description}
        onCommit={onDescriptionCommit}
        multiline
        className="mt-1 font-body text-xs text-text-secondary line-clamp-2"
      />

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
}

export const InsightNode = memo(InsightNodeComponent);

export const nodeTypes = { insight: InsightNode };
