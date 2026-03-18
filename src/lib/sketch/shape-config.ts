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
  problem: "#E07A5F",
  cause: "#E07A5F",
  idea: "#5FE0C1",
  solution: "#5DCAA5",
  context: "#7B8794",
};

export const SHAPE_FILL_DARK: Record<NodeType, string> = {
  problem: "rgba(224, 122, 95, 0.04)",
  cause: "rgba(224, 122, 95, 0.04)",
  idea: "rgba(95, 224, 193, 0.04)",
  solution: "rgba(93, 202, 165, 0.04)",
  context: "rgba(123, 135, 148, 0.03)",
};

export const SHAPE_FILL_LIGHT: Record<NodeType, string> = {
  problem: "rgba(224, 122, 95, 0.07)",
  cause: "rgba(224, 122, 95, 0.07)",
  idea: "rgba(95, 224, 193, 0.07)",
  solution: "rgba(93, 202, 165, 0.07)",
  context: "rgba(123, 135, 148, 0.06)",
};
