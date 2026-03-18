"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  generateRoughCloud,
  generateRoughEllipse,
  generateRoughRectangle,
  generateRoughDiamond,
  type RoughShapeResult,
} from "@/lib/sketch/rough-shapes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { SketchNodeData } from "@/types/canvas";
import { SKETCH_COLORS } from "@/types/canvas";
import { getShapeDimensions } from "@/lib/sketch/shape-config";

function SketchNodeComponent({ id, data }: NodeProps) {
  const d = data as unknown as SketchNodeData;
  const reducedMotion = useReducedMotion();
  const color = SKETCH_COLORS[d.nodeType] ?? "#7B8794";
  const delay = d.animationDelay ?? 0;
  const { width: NODE_W, height: NODE_H } = getShapeDimensions(d.nodeType);

  const shape: RoughShapeResult = useMemo(() => {
    switch (d.nodeType) {
      case "problem":
      case "cause":
        return generateRoughEllipse(NODE_W, NODE_H, id);
      case "idea":
        return generateRoughCloud(NODE_W, NODE_H, id);
      case "solution":
        return generateRoughDiamond(NODE_W, NODE_H, id);
      case "context":
      default:
        return generateRoughRectangle(NODE_W, NODE_H, id);
    }
  }, [d.nodeType, id, NODE_W, NODE_H]);

  // Estimate path length for stroke-dashoffset animation
  const pathLength = 800;

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
      style={{ width: NODE_W, height: NODE_H, position: "relative" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <svg
        width={NODE_W}
        height={NODE_H}
        viewBox={`0 0 ${NODE_W} ${NODE_H}`}
        style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
      >
        {d.nodeType === "context" ? (
          shape.strokePaths.map((pathD, i) => (
            <motion.path
              key={i}
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay, duration: 0.4, ease: "easeOut" }}
            />
          ))
        ) : (
          shape.strokePaths.map((pathD, i) => (
            <motion.path
              key={i}
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={
                reducedMotion
                  ? { strokeDashoffset: 0 }
                  : { strokeDasharray: pathLength, strokeDashoffset: pathLength }
              }
              animate={{ strokeDashoffset: 0 }}
              transition={{ delay, duration: 0.6, ease: "easeOut" }}
            />
          ))
        )}
      </svg>

      {/* Text label */}
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5, duration: 0.2 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 20px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#E0E0E0",
            lineHeight: 1.4,
            maxWidth: NODE_W - 40,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {d.label}
        </span>
      </motion.div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </motion.div>
  );
}

export const SketchNode = memo(SketchNodeComponent);
export const sketchNodeTypes = { sketch: SketchNode };
