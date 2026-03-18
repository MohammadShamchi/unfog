"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  generateCloudPath,
  generateCirclePath,
  generateRoundedRectPath,
} from "@/lib/sketch/sketchy-paths";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { SketchNodeData } from "@/types/canvas";
import { SKETCH_COLORS } from "@/types/canvas";

const NODE_W = 260;
const NODE_H = 100;

function SketchNodeComponent({ id, data }: NodeProps) {
  const d = data as unknown as SketchNodeData;
  const reducedMotion = useReducedMotion();
  const color = SKETCH_COLORS[d.nodeType] ?? "#7B8794";
  const delay = d.animationDelay ?? 0;

  const shapePath = useMemo(() => {
    switch (d.nodeType) {
      case "problem":
        return generateCloudPath(NODE_W, NODE_H, id);
      case "solution":
        return generateCirclePath(NODE_W / 2, NODE_H / 2, Math.min(NODE_W, NODE_H) / 2 - 6, id);
      default:
        return generateRoundedRectPath(NODE_W, NODE_H, 12, id);
    }
  }, [d.nodeType, id]);

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
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <motion.path
          d={shapePath}
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
