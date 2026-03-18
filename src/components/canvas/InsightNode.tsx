"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { InsightNode as InsightNodeType } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";
import { soundEngine } from "@/lib/sound/sound-engine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useFloatingMotion } from "@/hooks/use-floating-motion";
import { useIsDark } from "@/hooks/use-is-dark";
import { getNodeGlow } from "@/lib/theme/node-styles";
import { EditableText } from "./EditableText";
import { TypeBadge } from "./TypeBadge";
import { NodeToolbar } from "./NodeToolbar";

function InsightNodeComponent({ id, data }: NodeProps<InsightNodeType>) {
  const reducedMotion = useReducedMotion();
  const delay = data.animationDelay ?? 0;
  const isFogged = useCanvasStore((s) => s.isFogged);
  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);
  const branchNodeIds = useFocusStore((s) => s.branchNodeIds);
  const isDark = useIsDark();

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isDragging = useStore((s) => s.nodeLookup.get(id)?.dragging ?? false);

  const floatY = useFloatingMotion(id, isDragging || reducedMotion);

  const revealed = !isFogged || isHovered || isEditing;

  const isFocusActive = focusedNodeId !== null;
  const isInBranch = branchNodeIds.includes(id);
  const isFocusedNode = focusedNodeId === id;
  const isDimmed = isFocusActive && !isInBranch;

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

  const glowShadow = getNodeGlow(
    data.nodeType,
    { isHovered, isFocused: isFocusedNode },
    isDark,
  );

  const topBorderColor = isDark
    ? `var(--node-${data.nodeType}-badge-text)40`
    : `var(--node-${data.nodeType}-badge-text)30`;

  const targetOpacity = isDimmed ? 0.15 : revealed ? 1 : 0.42;

  return (
    <motion.div
      className="group relative min-w-[200px] max-w-[280px] rounded-xl px-4 py-3"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderWidth: "2px 1px 1px 1px",
        borderStyle: "solid",
        borderTopColor: topBorderColor,
        borderRightColor: isHovered ? "var(--border-hover)" : "var(--border)",
        borderBottomColor: isHovered ? "var(--border-hover)" : "var(--border)",
        borderLeftColor: isHovered ? "var(--border-hover)" : "var(--border)",
        boxShadow: glowShadow,
        y: floatY,
        pointerEvents: isDimmed ? "none" : "auto",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: targetOpacity,
        scale: 1,
      }}
      transition={{
        opacity: { duration: 0.3, ease: "easeOut" },
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
      <div className="mb-2">
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
        className="mt-1.5 font-body text-xs text-text-secondary leading-relaxed line-clamp-2"
      />

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
}

export const InsightNode = memo(InsightNodeComponent);

export const nodeTypes = { insight: InsightNode };
