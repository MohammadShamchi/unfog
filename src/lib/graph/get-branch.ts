import type { InsightEdge } from "@/types/canvas";

/**
 * BFS traversal in both directions (upstream + downstream).
 * Returns all reachable node IDs from the starting node.
 */
export function getBranch(nodeId: string, edges: InsightEdge[]): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [nodeId];

  // Build adjacency lists for both directions
  const downstream = new Map<string, string[]>();
  const upstream = new Map<string, string[]>();

  for (const edge of edges) {
    if (!downstream.has(edge.source)) downstream.set(edge.source, []);
    downstream.get(edge.source)!.push(edge.target);

    if (!upstream.has(edge.target)) upstream.set(edge.target, []);
    upstream.get(edge.target)!.push(edge.source);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // Traverse downstream
    const down = downstream.get(current) ?? [];
    for (const next of down) {
      if (!visited.has(next)) queue.push(next);
    }

    // Traverse upstream
    const up = upstream.get(current) ?? [];
    for (const prev of up) {
      if (!visited.has(prev)) queue.push(prev);
    }
  }

  return visited;
}
