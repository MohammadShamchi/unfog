// ─── Node types that map to the visual system ───
export type NodeType = "problem" | "cause" | "solution" | "context";

// ─── What the AI returns ───
export interface AnalysisNode {
  id: string;           // "node_1", "node_2", etc.
  type: NodeType;
  label: string;        // Short title — 3-6 words
  description: string;  // 1-2 sentence explanation
}

export interface AnalysisEdge {
  source: string;       // Node ID
  target: string;       // Node ID
  label?: string;       // Optional relationship label
}

export interface AnalysisResponse {
  summary: string;      // One-line problem summary
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
}

// ─── What the client sends ───
export interface AnalyzeRequest {
  prompt: string;       // User's raw text input
  language?: string;    // Detected or specified language (optional)
}

// ─── Re-analysis request (Spec 04) ───
export interface RefineRequest {
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
  userEdits: string;    // Description of what changed
}
