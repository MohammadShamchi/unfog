import dagre from "@dagrejs/dagre";
import type { AnalysisResponse, AnalysisNode } from "@/types/analysis";
import type { InsightNode, InsightEdge } from "@/types/canvas";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;

export function layoutAnalysis(analysis: AnalysisResponse): {
  nodes: InsightNode[];
  edges: InsightEdge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  for (const node of analysis.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of analysis.edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodes: InsightNode[] = analysis.nodes.map((node, index) => {
    const pos = g.node(node.id);
    return {
      id: node.id,
      type: "insight",
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
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

/** Incremental layout: positions only new nodes while preserving existing positions. */
export function layoutNewNodes(
  existingNodes: InsightNode[],
  newAnalysisNodes: AnalysisNode[],
  allEdges: InsightEdge[]
): InsightNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  // Add existing nodes with their current positions
  for (const node of existingNodes) {
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      x: node.position.x + NODE_WIDTH / 2,
      y: node.position.y + NODE_HEIGHT / 2,
    });
  }

  // Add new nodes (dagre will position them)
  for (const node of newAnalysisNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
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
    return {
      id: node.id,
      type: "insight" as const,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
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
