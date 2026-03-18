"use client";

import { useState } from "react";
import { useStore } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useFloatingMotion } from "@/hooks/use-floating-motion";
import { useIsDark } from "@/hooks/use-is-dark";
import { getNodeGlow } from "@/lib/theme/node-styles";
import type { NodeType } from "@/types/analysis";

export function useNodeInteraction(id: string, nodeType: NodeType) {
  const reducedMotion = useReducedMotion();
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

  const glowShadow = getNodeGlow(
    nodeType,
    { isHovered, isFocused: isFocusedNode },
    isDark,
  );

  const targetOpacity = isDimmed ? 0.15 : revealed ? 1 : 0.42;

  return {
    revealed,
    isDimmed,
    isDragging,
    isHovered,
    setIsHovered,
    isEditing,
    setIsEditing,
    floatY,
    glowShadow,
    targetOpacity,
    reducedMotion,
    isDark,
    isFocusedNode,
  };
}
