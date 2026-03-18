"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { NODE_BADGE_STYLES, NODE_TYPE_LABELS } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";
import { useGhostStore } from "@/stores/ghost-store";

interface GhostNodeProps {
  data: {
    ghostId: string;
    label: string;
    nodeType: NodeType;
    description: string;
    connectTo: string;
    realLabel: string;
    realDescription: string;
  };
}

function GhostNodeComponent({ data }: GhostNodeProps) {
  const badge = NODE_BADGE_STYLES[data.nodeType];
  const acceptGhost = useGhostStore((s) => s.acceptGhost);
  const dismissGhost = useGhostStore((s) => s.dismissGhost);

  return (
    <motion.div
      className="relative min-w-[200px] max-w-[280px] rounded-xl px-4 py-3"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderWidth: "2px 1px 1px 1px",
        borderStyle: "dashed",
        borderTopColor: badge.text,
        borderRightColor: "var(--border)",
        borderBottomColor: "var(--border)",
        borderLeftColor: "var(--border)",
        zIndex: -1,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 0.35 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ opacity: 0.7 }}
      transition={{ duration: 0.3 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {/* Faint type badge */}
      <div className="mb-2">
        <span
          className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider opacity-50"
          style={{
            backgroundColor: badge.bg,
            color: badge.text,
          }}
        >
          {NODE_TYPE_LABELS[data.nodeType]}
        </span>
      </div>

      {/* Question text */}
      <p dir="auto" className="font-display text-sm font-semibold text-text-primary opacity-60">
        {data.label}
      </p>

      {/* Accept/Dismiss buttons */}
      <div className="mt-2.5 flex items-center gap-2">
        <button
          className="flex items-center justify-center rounded-md p-2 transition-all hover:opacity-100"
          style={{
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent)",
            minWidth: 44,
            minHeight: 44,
          }}
          onClick={(e) => {
            e.stopPropagation();
            acceptGhost(data.ghostId);
          }}
        >
          <Check size={16} />
        </button>
        <button
          className="flex items-center justify-center rounded-md p-2 text-text-muted transition-all hover:text-text-secondary hover:opacity-100"
          style={{
            backgroundColor: "var(--bg-hover)",
            minWidth: 44,
            minHeight: 44,
          }}
          onClick={(e) => {
            e.stopPropagation();
            dismissGhost(data.ghostId);
          }}
        >
          <X size={16} />
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </motion.div>
  );
}

export const GhostNode = memo(GhostNodeComponent);
