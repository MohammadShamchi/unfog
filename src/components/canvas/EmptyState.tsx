"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function EmptyState() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <motion.div
          animate={
            reducedMotion ? {} : { opacity: [0.3, 0.7, 0.3] }
          }
          transition={
            reducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <ArrowLeft size={20} className="text-text-muted" />
        </motion.div>
        <p className="font-body text-sm text-text-muted">
          Describe a problem to see your clarity map
        </p>
      </div>
    </div>
  );
}
