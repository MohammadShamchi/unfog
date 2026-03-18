import type { Node, Edge } from "@xyflow/react";
import type { NodeType } from "./analysis";

export interface InsightNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  nodeType: NodeType;
  animationDelay?: number;
}

export type InsightNode = Node<InsightNodeData, "insight">;
export type InsightEdge = Edge;

export const NODE_COLORS: Record<NodeType, string> = {
  problem: "#E85D5D",   // Muted coral-red
  cause: "#F0A04B",     // Warmer amber
  solution: "#4DD4B0",  // Desaturated teal
  context: "#7B8CDE",   // Softer indigo
};

export const NODE_COLORS_MUTED: Record<NodeType, string> = {
  problem: "rgba(232, 93, 93, 0.15)",
  cause: "rgba(240, 160, 75, 0.15)",
  solution: "rgba(77, 212, 176, 0.15)",
  context: "rgba(123, 140, 222, 0.15)",
};

export const NODE_BADGE_STYLES: Record<NodeType, { bg: string; text: string }> = {
  problem:  { bg: "var(--node-problem-badge-bg)",  text: "var(--node-problem-badge-text)" },
  cause:    { bg: "var(--node-cause-badge-bg)",     text: "var(--node-cause-badge-text)" },
  solution: { bg: "var(--node-solution-badge-bg)",  text: "var(--node-solution-badge-text)" },
  context:  { bg: "var(--node-context-badge-bg)",   text: "var(--node-context-badge-text)" },
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  problem: "Problem",
  cause: "Cause",
  solution: "Solution",
  context: "Context",
};

export type EditEvent =
  | { type: "label_changed"; nodeId: string; from: string; to: string }
  | { type: "description_changed"; nodeId: string; from: string; to: string }
  | { type: "type_changed"; nodeId: string; from: NodeType; to: NodeType }
  | { type: "node_deleted"; nodeId: string; label: string }
  | { type: "node_created"; nodeId: string }
  | { type: "edge_created"; source: string; target: string }
  | { type: "edge_deleted"; source: string; target: string }
  | { type: "edge_label_changed"; edgeId: string; from: string; to: string };
