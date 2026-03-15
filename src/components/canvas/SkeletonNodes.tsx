"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SKELETON_POSITIONS = [
  { x: 280, y: 40 },
  { x: 120, y: 180 },
  { x: 440, y: 180 },
  { x: 280, y: 320 },
];

function SkeletonRect({ x, y, delay }: { x: number; y: number; delay: number }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute rounded-md border"
      style={{
        left: x,
        top: y,
        width: 200,
        height: 72,
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-elevated)",
      }}
      animate={
        reducedMotion
          ? { opacity: 0.25 }
          : { opacity: [0.15, 0.35, 0.15] }
      }
      transition={
        reducedMotion
          ? {}
          : { duration: 0.8, repeat: Infinity, delay }
      }
    >
      <div className="p-3 space-y-2">
        <div
          className="h-2.5 rounded"
          style={{ width: "60%", backgroundColor: "var(--border)" }}
        />
        <div
          className="h-2 rounded"
          style={{ width: "85%", backgroundColor: "var(--border)" }}
        />
      </div>
    </motion.div>
  );
}

export function SkeletonNodes() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative" style={{ width: 640, height: 400 }}>
        {SKELETON_POSITIONS.map((pos, i) => (
          <SkeletonRect key={i} x={pos.x} y={pos.y} delay={i * 0.15} />
        ))}
      </div>
    </div>
  );
}
