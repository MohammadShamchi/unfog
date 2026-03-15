"use client";

import { motion } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas-store";

export function ThinkingOverlay() {
  const isRefining = useCanvasStore((s) => s.isRefining);

  if (!isRefining) return null;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none border-2 rounded-sm z-10"
      style={{ borderColor: "var(--accent-glow)" }}
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
