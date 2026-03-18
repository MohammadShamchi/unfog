"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function RevealOverlay() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.5, duration: 0.6, ease: "easeOut" }}
    >
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          color: "#5FE0C1",
        }}
      >
        okay — let me show you what I&apos;m seeing
      </motion.p>
    </motion.div>
  );
}
