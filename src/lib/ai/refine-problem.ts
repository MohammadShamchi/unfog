import { REFINE_SYSTEM_PROMPT } from "./prompts";
import { createProviderFromConfig, safeParseJSON, resolveTemperature } from "./client";
import type { RefineResponse, AnalysisNode, AnalysisEdge, AIConfig } from "@/types/analysis";

const refineSchema = {
  type: "object" as const,
  properties: {
    summary: { type: "string" as const },
    addNodes: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          type: {
            type: "string" as const,
            enum: ["problem", "cause", "solution", "context"],
          },
          label: { type: "string" as const },
          description: { type: "string" as const },
        },
        required: ["id", "type", "label", "description"],
      },
    },
    updateNodes: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          label: { type: "string" as const },
          description: { type: "string" as const },
          type: {
            type: "string" as const,
            enum: ["problem", "cause", "solution", "context"],
          },
        },
        required: ["id"],
      },
    },
    removeNodeIds: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    addEdges: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          source: { type: "string" as const },
          target: { type: "string" as const },
          label: { type: "string" as const },
        },
        required: ["source", "target"],
      },
    },
    removeEdges: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          source: { type: "string" as const },
          target: { type: "string" as const },
        },
        required: ["source", "target"],
      },
    },
  },
  required: ["summary", "addNodes", "updateNodes", "removeNodeIds", "addEdges", "removeEdges"],
};

interface RefineInput {
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
  editSummary: string;
}

export async function refineProblem(input: RefineInput, config?: AIConfig): Promise<RefineResponse> {
  const provider = createProviderFromConfig(config);

  const userMessage = `ORIGINAL PROMPT:
${input.originalPrompt}

CURRENT NODES:
${JSON.stringify(input.currentNodes, null, 2)}

CURRENT EDGES:
${JSON.stringify(input.currentEdges, null, 2)}

USER EDITS:
${input.editSummary}

Analyze the current state and suggest improvements.`;

  const rawText = await provider.generate({
    systemPrompt: REFINE_SYSTEM_PROMPT,
    userMessage,
    maxOutputTokens: 4096,
    temperature: resolveTemperature(config),
    responseSchema: refineSchema,
  });

  const parsed = safeParseJSON<RefineResponse>(rawText);

  // Safety: cap new nodes
  if (parsed.addNodes.length > 10) {
    parsed.addNodes = parsed.addNodes.slice(0, 10);
  }

  return parsed;
}
