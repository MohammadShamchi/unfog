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
  problem: "#EF4444",
  cause: "#F59E0B",
  solution: "#5FE0C1",
  context: "#6366F1",
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
