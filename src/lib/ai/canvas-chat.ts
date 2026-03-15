import { getClient, safeParseJSON, getModel, getTemperature, generateWithBackoff } from "./client";
import { CANVAS_CHAT_SYSTEM_PROMPT } from "./prompts";
import type { ChatRequest, ChatResponse } from "@/types/analysis";
import { formatGraphContext } from "@/lib/graph/causal-chain";

const chatSchema = {
  type: "object" as const,
  properties: {
    message: { type: "string" as const },
    operations: {
      type: "object" as const,
      properties: {
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
      required: ["addNodes", "updateNodes", "removeNodeIds", "addEdges", "removeEdges"],
    },
  },
  required: ["message", "operations"],
};

export async function canvasChat(input: ChatRequest): Promise<ChatResponse> {
  const client = getClient();
  const model = getModel();

  let contextStr = `ORIGINAL PROMPT:
${input.originalPrompt}

CURRENT MAP NODES:
${JSON.stringify(input.currentNodes, null, 2)}

CURRENT MAP EDGES:
${JSON.stringify(input.currentEdges, null, 2)}`;

  // If we have structured graph context, give the AI the full causal chain
  if (input.graphContext) {
    contextStr += `\n\n--- FOCUSED NODE ANALYSIS ---\n${formatGraphContext(input.graphContext)}`;
  } else if (input.selectedNodeId) {
    contextStr += `\n\nSELECTED NODE:
ID: ${input.selectedNodeId}
Label: ${input.selectedNodeLabel || ""}`;
  }

  if (input.chatHistory.length > 0) {
    contextStr += `\n\nCHAT HISTORY:
${input.chatHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
  }

  contextStr += `\n\nUSER MESSAGE:\n${input.message}`;

  const response = await generateWithBackoff(client, {
    model,
    contents: [{ role: "user", parts: [{ text: contextStr }] }],
    config: {
      systemInstruction: CANVAS_CHAT_SYSTEM_PROMPT,
      temperature: getTemperature(),
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: chatSchema,
    },
  }, "[Unfog AI Chat]");

  const rawText = response.text;
  if (!rawText) throw new Error("Empty response from AI model");
  const parsed = safeParseJSON<ChatResponse>(rawText);

  // Cap addNodes at 6
  if (parsed.operations.addNodes.length > 6) {
    parsed.operations.addNodes = parsed.operations.addNodes.slice(0, 6);
  }

  return parsed;
}
