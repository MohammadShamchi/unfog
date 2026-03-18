// ─── AI provider configuration ───
export interface AIConfig {
  provider: "gemini" | "openai" | "anthropic" | "openrouter";
  apiKey: string;
  model: string;
  temperature: number;
}

// ─── Node types that map to the visual system ───
export type NodeType = "problem" | "cause" | "solution" | "context" | "idea";

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

// ─── Spec 14: Explore node ───
export interface ExploreRequest {
  nodeId: string;
  nodeLabel: string;
  nodeDescription: string;
  nodeType: NodeType;
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
}

export interface ExploreResponse {
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
}

// ─── Spec 15: Contextual chat ───
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  operations?: ChatOperations;
  timestamp: number;
}

export interface ChatOperations {
  addNodes: AnalysisNode[];
  updateNodes: Array<{ id: string; label?: string; description?: string; type?: NodeType }>;
  removeNodeIds: string[];
  addEdges: AnalysisEdge[];
  removeEdges: Array<{ source: string; target: string }>;
}

export interface ChatRequest {
  message: string;
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
  selectedNodeId?: string;
  selectedNodeLabel?: string;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  /** Structured graph context for the selected/focused node */
  graphContext?: {
    selectedNode: AnalysisNode;
    directParents: AnalysisNode[];
    directChildren: AnalysisNode[];
    ancestors: AnalysisNode[];
    descendants: AnalysisNode[];
    relevantEdges: AnalysisEdge[];
  };
}

export interface ChatResponse {
  message: string;
  operations: ChatOperations;
}

// ─── Spec 16: Ghost nodes ───
export interface GhostSuggestion {
  id: string;
  type: NodeType;
  questionText: string;
  label: string;
  description: string;
  connectTo: string;
}

export interface SuggestGhostsRequest {
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
  dismissedTopics: string[];
}

export interface SuggestGhostsResponse {
  suggestions: GhostSuggestion[];
}

// ─── Auto-options (alternatives + risks) ───
export interface OptionNode extends AnalysisNode {
  sentiment: "positive" | "negative";
  parentOptionId?: string;
  pros?: string[];
  cons?: string[];
}

export interface OptionsRequest {
  nodeId: string;
  nodeLabel: string;
  nodeDescription: string;
  nodeType: NodeType;
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
}

export interface OptionsResponse {
  options: OptionNode[];
  edges: AnalysisEdge[];
}
