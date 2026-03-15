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
  intakeAnswers?: IntakeAnswer[];  // Attached context from intake
}

// ─── Re-analysis request ───
export interface RefineRequest {
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
  userEdits: string;
}

// ─── Re-analysis response (diff format) ───
export interface RefineResponse {
  summary: string;
  addNodes: AnalysisNode[];
  updateNodes: Array<{ id: string; label?: string; description?: string; type?: NodeType }>;
  removeNodeIds: string[];
  addEdges: AnalysisEdge[];
  removeEdges: Array<{ source: string; target: string }>;
}

// ─── Intake question from AI ───
export interface IntakeQuestion {
  id: string;              // "q_1", "q_2", etc.
  question: string;        // The question text
  options: string[];       // 2-4 selectable answers
  allowCustom: boolean;    // Show "Other" text input
}

// ─── User's answer to a question ───
export interface IntakeAnswer {
  questionId: string;
  question: string;        // Store the question text for display
  answer: string;          // Selected option or custom text
  isCustom: boolean;       // Was this a custom "Other" answer
}

// ─── AI assessment response ───
export interface IntakeAssessment {
  sufficient: boolean;           // true = skip to generation
  questions?: IntakeQuestion[];  // 1-3 questions if not sufficient
  reasoning?: string;            // Why AI needs more info (internal, not shown)
}

// ─── Intake conversation state ───
export interface IntakeState {
  status: "idle" | "assessing" | "asking" | "answering" | "generating";
  rounds: IntakeRound[];         // Conversation history
  enrichedPrompt: string | null; // Final combined prompt for generation
}

export interface IntakeRound {
  questions: IntakeQuestion[];
  answers: IntakeAnswer[];
}
