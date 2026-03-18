"use client";

import { memo, useMemo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { InsightNode } from "@/types/canvas";
import { generateRoughCloud } from "@/lib/sketch/rough-shapes";
import { getShapeDimensions, SHAPE_STROKE_COLORS, SHAPE_FILL_DARK, SHAPE_FILL_LIGHT } from "@/lib/sketch/shape-config";
import { useNodeInteraction } from "@/hooks/use-node-interaction";
import { NodeContent } from "./NodeContent";

function IdeaNodeComponent({ id, data, selected }: NodeProps<InsightNode>) {
  const { width, height } = getShapeDimensions("idea");
  const color = SHAPE_STROKE_COLORS.idea;

  const {
    isDimmed,
    isHovered,
    setIsHovered,
    setIsEditing,
    floatY,
    glowShadow,
    targetOpacity,
    reducedMotion,
    isDark,
  } = useNodeInteraction(id, "idea");

  const delay = data.animationDelay ?? 0;

  const shape = useMemo(
    () => generateRoughCloud(width, height, id),
    [width, height, id],
  );

  const fillColor = isDark ? SHAPE_FILL_DARK.idea : SHAPE_FILL_LIGHT.idea;
  const hoverFill = isDark ? "rgba(232, 197, 71, 0.08)" : "rgba(232, 197, 71, 0.12)";

  const handleEditStart = useCallback(() => setIsEditing(true), [setIsEditing]);
  const handleEditEnd = useCallback(() => setIsEditing(false), [setIsEditing]);

  return (
    <motion.div
      className="group relative"
      style={{
        width,
        height,
        y: floatY,
        pointerEvents: isDimmed ? "none" : "auto",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: targetOpacity }}
      transition={{ opacity: { duration: 0.3, delay: reducedMotion ? 0 : delay, ease: "easeOut" } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
      >
        <path
          d={shape.fillPath}
          fill={isHovered ? hoverFill : fillColor}
          stroke="none"
          style={{ transition: "fill 150ms ease" }}
        />
        {shape.strokePaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={selected ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: "stroke-width 150ms ease" }}
          />
        ))}
      </svg>

      <div
        className="relative z-[1] flex flex-col items-center justify-center text-center"
        style={{ width, height, padding: "12px 24px" }}
      >
        <NodeContent
          nodeId={id}
          data={data}
          color={color}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
}

export const IdeaNode = memo(IdeaNodeComponent);
