import type { InsightNode, InsightEdge } from "@/types/canvas";

interface CanvasExport {
  version: "0.1";
  exportedAt: string;
  prompt: string;
  summary: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    description: string;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}

export function exportCanvas(state: {
  nodes: InsightNode[];
  edges: InsightEdge[];
  summary: string;
  originalPrompt: string;
}): CanvasExport {
  return {
    version: "0.1",
    exportedAt: new Date().toISOString(),
    prompt: state.originalPrompt,
    summary: state.summary,
    nodes: state.nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      description: n.data.description,
      position: n.position,
    })),
    edges: state.edges.map((e) => ({
      source: e.source,
      target: e.target,
      ...(typeof e.label === "string" && { label: e.label }),
    })),
  };
}

export function importCanvas(json: unknown): {
  nodes: InsightNode[];
  edges: InsightEdge[];
  summary: string;
  prompt: string;
} {
  const data = json as CanvasExport;
  if (!data || data.version !== "0.1" || !Array.isArray(data.nodes)) {
    throw new Error("Invalid export format");
  }

  const nodes: InsightNode[] = data.nodes.map((n) => ({
    id: n.id,
    type: "insight" as const,
    position: n.position,
    data: {
      label: n.label,
      description: n.description,
      nodeType: n.type as import("@/types/analysis").NodeType,
    },
  }));

  const edges: InsightEdge[] = data.edges.map((e, i) => ({
    id: `edge_import_${i}`,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    label: e.label,
  }));

  return {
    nodes,
    edges,
    summary: data.summary || "",
    prompt: data.prompt || "",
  };
}

export function downloadAsJSON(data: CanvasExport) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `unfog-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
