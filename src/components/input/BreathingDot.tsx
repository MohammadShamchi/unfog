"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface BreathingDotProps {
  visible: boolean;
}

export function BreathingDot({ visible }: BreathingDotProps) {
  const reducedMotion = useReducedMotion();

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={
        reducedMotion
          ? { opacity: 0.7 }
          : {
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1, 0.8],
            }
      }
      exit={{ opacity: 0 }}
      transition={
        reducedMotion
          ? { duration: 0.2 }
          : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
      }
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "#5FE0C1",
        flexShrink: 0,
      }}
    />
  );
}
