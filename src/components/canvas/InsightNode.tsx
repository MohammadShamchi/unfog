"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { InsightNode as InsightNodeType } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";
import { NODE_COLORS } from "@/types/canvas";
import { useCanvasStore } from "@/stores/canvas-store";
import { soundEngine } from "@/lib/sound/sound-engine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useFloatingMotion } from "@/hooks/use-floating-motion";
import { EditableText } from "./EditableText";
import { TypeBadge } from "./TypeBadge";
import { NodeToolbar } from "./NodeToolbar";

function InsightNodeComponent({ id, data }: NodeProps<InsightNodeType>) {
  const color = NODE_COLORS[data.nodeType];
  const reducedMotion = useReducedMotion();
  const delay = data.animationDelay ?? 0;
  const isFogged = useCanvasStore((s) => s.isFogged);

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isDragging = useStore((s) => s.nodeLookup.get(id)?.dragging ?? false);

  const floatY = useFloatingMotion(id, isDragging || reducedMotion);

  const revealed = !isFogged || isHovered || isEditing;

  const onLabelCommit = useCallback(
    (newLabel: string) => {
      useCanvasStore.getState().updateNodeData(id, { label: newLabel });
    },
    [id],
  );

  const onDescriptionCommit = useCallback(
    (newDesc: string) => {
      useCanvasStore.getState().updateNodeData(id, { description: newDesc });
    },
    [id],
  );

  const onTypeChange = useCallback(
    (newType: NodeType) => {
      useCanvasStore.getState().changeNodeType(id, newType);
      soundEngine.playTypeChange();
    },
    [id],
  );

  const handleEditStart = useCallback(() => setIsEditing(true), []);
  const handleEditEnd = useCallback(() => setIsEditing(false), []);

  const entryDuration = reducedMotion ? 0 : 0.35;

  const glowShadow = isHovered
    ? `0 0 20px 4px ${color}25, 0 0 6px 2px ${color}18`
    : `0 0 var(--node-glow-spread) 2px ${color}15, 0 0 4px 1px ${color}10`;

  return (
    <motion.div
      className="group relative min-w-[200px] max-w-[280px] rounded-xl px-3 py-2.5"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderWidth: "2px 1px 1px 1px",
        borderStyle: "solid",
        borderTopColor: `${color}40`,
        borderRightColor: isHovered ? "var(--border-hover)" : "var(--border)",
        borderBottomColor: isHovered ? "var(--border-hover)" : "var(--border)",
        borderLeftColor: isHovered ? "var(--border-hover)" : "var(--border)",
        boxShadow: glowShadow,
        y: floatY,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: revealed ? 1 : 0.42,
        scale: 1,
      }}
      transition={{
        opacity: { duration: 0.18, ease: "easeOut" },
        scale: {
          duration: entryDuration,
          delay: reducedMotion ? 0 : delay,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        onEditStart={handleEditStart}
        onEditEnd={handleEditEnd}
        className="font-display text-sm font-semibold text-text-primary"
      />

      {/* Editable description */}
      <EditableText
        value={data.description}
        onCommit={onDescriptionCommit}
        onEditStart={handleEditStart}
        onEditEnd={handleEditEnd}
        multiline
        className="mt-1 font-body text-xs text-text-secondary line-clamp-2"
      />

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
}

export const InsightNode = memo(InsightNodeComponent);

export const nodeTypes = { insight: InsightNode };
