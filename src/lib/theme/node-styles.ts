import type { NodeType } from "@/types/analysis";
import { NODE_COLORS } from "@/types/canvas";

interface GlowState {
  isHovered: boolean;
  isFocused: boolean;
}

export function getNodeGlow(
  nodeType: NodeType,
  state: GlowState,
  isDark: boolean,
): string {
  if (!isDark) {
    if (state.isFocused) {
      return "0 0 0 2px var(--accent), 0 4px 16px rgba(0, 0, 0, 0.12)";
    }
    if (state.isHovered) {
      return "0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 6px rgba(0, 0, 0, 0.08)";
    }
    return "0 1px 6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)";
  }

  const color = NODE_COLORS[nodeType];

  if (state.isFocused) {
    return `0 0 24px 6px ${color}30, 0 0 8px 3px var(--accent-glow)`;
  }
  if (state.isHovered) {
    return `0 0 20px 4px ${color}25, 0 0 6px 2px ${color}18`;
  }
  return `0 0 var(--node-glow-spread) 2px ${color}15, 0 0 4px 1px ${color}10`;
}
