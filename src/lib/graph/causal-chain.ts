import type { InsightEdge } from "@/types/canvas";
import type { AnalysisNode, AnalysisEdge } from "@/types/analysis";

/**
 * Walk upstream: find all ancestor nodes (root causes).
 * Returns ordered from root → selected node.
 */
export function getAncestors(
  nodeId: string,
  edges: Array<{ source: string; target: string }>
): string[] {
  const upstream = new Map<string, string[]>();
  for (const e of edges) {
    if (!upstream.has(e.target)) upstream.set(e.target, []);
    upstream.get(e.target)!.push(e.source);
  }

  const visited = new Set<string>();
  const order: string[] = [];

  function dfs(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const parent of upstream.get(id) ?? []) {
      dfs(parent);
    }
    order.push(id);
  }

  dfs(nodeId);
  // Remove the node itself — we only want ancestors
  return order.filter((id) => id !== nodeId);
}

/**
 * Walk downstream: find all descendant nodes (effects/sub-problems).
 * Returns in BFS order from selected node outward.
 */
export function getDescendants(
  nodeId: string,
  edges: Array<{ source: string; target: string }>
): string[] {
  const downstream = new Map<string, string[]>();
  for (const e of edges) {
    if (!downstream.has(e.source)) downstream.set(e.source, []);
    downstream.get(e.source)!.push(e.target);
  }

  const visited = new Set<string>([nodeId]);
  const queue = [nodeId];
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of downstream.get(current) ?? []) {
      if (!visited.has(child)) {
        visited.add(child);
        result.push(child);
        queue.push(child);
      }
    }
  }

  return result;
}

/**
 * Get direct neighbors (1-hop connections in both directions).
 */
export function getDirectNeighbors(
  nodeId: string,
  edges: Array<{ source: string; target: string }>
): { parents: string[]; children: string[] } {
  const parents: string[] = [];
  const children: string[] = [];

  for (const e of edges) {
    if (e.target === nodeId) parents.push(e.source);
    if (e.source === nodeId) children.push(e.target);
  }

  return { parents, children };
}

interface GraphContext {
  selectedNode: AnalysisNode;
  ancestors: AnalysisNode[];       // root causes, ordered root → node
  descendants: AnalysisNode[];     // effects, BFS order
  directParents: AnalysisNode[];   // immediate causes
  directChildren: AnalysisNode[];  // immediate effects
  relevantEdges: AnalysisEdge[];   // edges within the causal chain
}

/**
 * Build rich structural context for a selected node.
 * This gives the AI a complete understanding of where the node
 * sits in the problem graph — its causes, effects, and connections.
 */
export function buildNodeGraphContext(
  selectedNodeId: string,
  allNodes: AnalysisNode[],
  allEdges: AnalysisEdge[]
): GraphContext | null {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const selected = nodeMap.get(selectedNodeId);
  if (!selected) return null;

  const ancestorIds = getAncestors(selectedNodeId, allEdges);
  const descendantIds = getDescendants(selectedNodeId, allEdges);
  const { parents, children } = getDirectNeighbors(selectedNodeId, allEdges);

  // All node IDs in the causal chain
  const chainIds = new Set([selectedNodeId, ...ancestorIds, ...descendantIds]);

  // Edges within the chain
  const relevantEdges = allEdges.filter(
    (e) => chainIds.has(e.source) && chainIds.has(e.target)
  );

  return {
    selectedNode: selected,
    ancestors: ancestorIds.map((id) => nodeMap.get(id)!).filter(Boolean),
    descendants: descendantIds.map((id) => nodeMap.get(id)!).filter(Boolean),
    directParents: parents.map((id) => nodeMap.get(id)!).filter(Boolean),
    directChildren: children.map((id) => nodeMap.get(id)!).filter(Boolean),
    relevantEdges,
  };
}

/**
 * Format graph context into a structured string for the AI prompt.
 */
export function formatGraphContext(ctx: GraphContext): string {
  const sections: string[] = [];

  sections.push(`SELECTED NODE:
${JSON.stringify(ctx.selectedNode, null, 2)}`);

  if (ctx.directParents.length > 0) {
    sections.push(`DIRECT CAUSES (parents of selected node):
${JSON.stringify(ctx.directParents, null, 2)}`);
  }

  if (ctx.directChildren.length > 0) {
    sections.push(`DIRECT EFFECTS (children of selected node):
${JSON.stringify(ctx.directChildren, null, 2)}`);
  }

  if (ctx.ancestors.length > ctx.directParents.length) {
    const deeperAncestors = ctx.ancestors.filter(
      (a) => !ctx.directParents.some((p) => p.id === a.id)
    );
    if (deeperAncestors.length > 0) {
      sections.push(`ROOT CAUSES (deeper ancestors, ordered root → node):
${JSON.stringify(deeperAncestors, null, 2)}`);
    }
  }

  if (ctx.descendants.length > ctx.directChildren.length) {
    const deeperDescendants = ctx.descendants.filter(
      (d) => !ctx.directChildren.some((c) => c.id === d.id)
    );
    if (deeperDescendants.length > 0) {
      sections.push(`DOWNSTREAM EFFECTS (deeper descendants):
${JSON.stringify(deeperDescendants, null, 2)}`);
    }
  }

  sections.push(`CAUSAL CHAIN EDGES:
${JSON.stringify(ctx.relevantEdges, null, 2)}`);

  return sections.join("\n\n");
}
