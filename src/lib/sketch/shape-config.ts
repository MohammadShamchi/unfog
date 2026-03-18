import type { NodeType } from "@/types/analysis";

interface ShapeDimensions {
  width: number;
  height: number;
}

const SHAPE_DIMENSIONS: Record<NodeType, ShapeDimensions> = {
  problem: { width: 220, height: 130 },
  cause: { width: 220, height: 130 },
  idea: { width: 240, height: 140 },
  solution: { width: 200, height: 160 },
  context: { width: 220, height: 120 },
};

export function getShapeDimensions(nodeType: NodeType): ShapeDimensions {
  return SHAPE_DIMENSIONS[nodeType] ?? SHAPE_DIMENSIONS.context;
}

export const SHAPE_STROKE_COLORS: Record<NodeType, string> = {
  problem: "#E85D5D",
  cause: "#F0A04B",
  idea: "#E8C547",
  solution: "#4DD4B0",
  context: "#7B8CDE",
};

export const SHAPE_FILL_DARK: Record<NodeType, string> = {
  problem: "rgba(232, 93, 93, 0.04)",
  cause: "rgba(240, 160, 75, 0.04)",
  idea: "rgba(232, 197, 71, 0.04)",
  solution: "rgba(77, 212, 176, 0.04)",
  context: "rgba(123, 140, 222, 0.03)",
};

export const SHAPE_FILL_LIGHT: Record<NodeType, string> = {
  problem: "rgba(232, 93, 93, 0.07)",
  cause: "rgba(240, 160, 75, 0.07)",
  idea: "rgba(232, 197, 71, 0.07)",
  solution: "rgba(77, 212, 176, 0.07)",
  context: "rgba(123, 140, 222, 0.06)",
};
