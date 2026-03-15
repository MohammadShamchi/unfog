"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NODE_COLORS, NODE_TYPE_LABELS } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";

interface TypeBadgeProps {
  nodeType: NodeType;
  onChange: (newType: NodeType) => void;
}

const NODE_TYPES: NodeType[] = ["problem", "cause", "solution", "context"];

export function TypeBadge({ nodeType, onChange }: TypeBadgeProps) {
  const color = NODE_COLORS[nodeType];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {NODE_TYPE_LABELS[nodeType]}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[120px]"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}
      >
        {NODE_TYPES.map((t) => (
          <DropdownMenuItem
            key={t}
            className="flex items-center gap-2 text-xs font-body cursor-pointer"
            style={{ color: "var(--text-primary)" }}
            onClick={(e) => {
              e.stopPropagation();
              if (t !== nodeType) onChange(t);
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[t] }}
            />
            {NODE_TYPE_LABELS[t]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
