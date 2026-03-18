import dagre from "@dagrejs/dagre";
import type { AnalysisResponse, AnalysisNode, NodeType } from "@/types/analysis";
import type { InsightNode, InsightEdge, ShapeType } from "@/types/canvas";
import { getShapeDimensions } from "@/lib/sketch/shape-config";

function dimFor(nodeType: NodeType) {
  const d = getShapeDimensions(nodeType);
  return { width: d.width, height: d.height };
}

export function layoutAnalysis(analysis: AnalysisResponse): {
  nodes: InsightNode[];
  edges: InsightEdge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 100 });

  for (const node of analysis.nodes) {
    const { width, height } = dimFor(node.type);
    g.setNode(node.id, { width, height });
  }

  for (const edge of analysis.edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodes: InsightNode[] = analysis.nodes.map((node, index) => {
    const pos = g.node(node.id);
    const { width, height } = dimFor(node.type);
    return {
      id: node.id,
      type: node.type as ShapeType,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
      data: {
        label: node.label,
        description: node.description,
        nodeType: node.type,
        animationDelay: index * 0.06,
      },
    };
  });

  const edges: InsightEdge[] = analysis.edges.map((edge, i) => ({
    id: `edge_${i}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    label: edge.label,
  }));

  return { nodes, edges };
}

/** Layout analysis nodes as sketch type with semantic-type-ordered stagger delays. */
export function layoutAnalysisAsSketch(analysis: AnalysisResponse): {
  nodes: Array<{
    id: string;
    type: "sketch";
    position: { x: number; y: number };
    data: {
      label: string;
      description: string;
      nodeType: AnalysisNode["type"];
      animationDelay: number;
    };
  }>;
  edges: InsightEdge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 100 });

  for (const node of analysis.nodes) {
    const { width, height } = dimFor(node.type);
    g.setNode(node.id, { width, height });
  }
  for (const edge of analysis.edges) {
    g.setEdge(edge.source, edge.target);
  }
  dagre.layout(g);

  // Group by type for staggered delays
  const typeBaseDelay: Record<string, number> = {
    problem: 0,
    cause: 0.8,
    idea: 1.0,
    context: 1.2,
    solution: 1.6,
  };
  const typeCounters: Record<string, number> = {};

  const nodes = analysis.nodes.map((node) => {
    const pos = g.node(node.id);
    const { width, height } = dimFor(node.type);
    const base = typeBaseDelay[node.type] ?? 0;
    const count = typeCounters[node.type] ?? 0;
    typeCounters[node.type] = count + 1;

    return {
      id: node.id,
      type: "sketch" as const,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
      data: {
        label: node.label,
        description: node.description,
        nodeType: node.type,
        animationDelay: base + count * 0.2,
      },
    };
  });

  const edges: InsightEdge[] = analysis.edges.map((edge, i) => ({
    id: `edge_${i}`,
    source: edge.source,
    target: edge.target,
    type: "sketch-edge",
    label: edge.label,
  }));

  return { nodes, edges };
}

/** Incremental layout: positions only new nodes while preserving existing positions. */
export function layoutNewNodes(
  existingNodes: InsightNode[],
  newAnalysisNodes: AnalysisNode[],
  allEdges: InsightEdge[]
): InsightNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 100 });

  // Add existing nodes with their current positions
  for (const node of existingNodes) {
    const nodeType = node.data.nodeType;
    const { width, height } = dimFor(nodeType);
    g.setNode(node.id, {
      width,
      height,
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    });
  }

  // Add new nodes (dagre will position them)
  for (const node of newAnalysisNodes) {
    const { width, height } = dimFor(node.type);
    g.setNode(node.id, { width, height });
  }

  // Add all edges
  for (const edge of allEdges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return newAnalysisNodes.map((node, index) => {
    const pos = g.node(node.id);
    const { width, height } = dimFor(node.type);
    return {
      id: node.id,
      type: node.type as ShapeType,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
      data: {
        label: node.label,
        description: node.description,
        nodeType: node.type,
        animationDelay: index * 0.06,
      },
    };
  });
}
