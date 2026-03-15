import { GoogleGenAI } from "@google/genai";
import { REFINE_SYSTEM_PROMPT } from "./prompts";
import type { RefineResponse, AnalysisNode, AnalysisEdge } from "@/types/analysis";

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

function safeParseJSON(raw: string): RefineResponse {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  text = text.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse AI refine response. Raw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenAI({ apiKey });
}

interface RefineInput {
  originalPrompt: string;
  currentNodes: AnalysisNode[];
  currentEdges: AnalysisEdge[];
  editSummary: string;
}

export async function refineProblem(input: RefineInput): Promise<RefineResponse> {
  const client = getClient();
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  const userMessage = `ORIGINAL PROMPT:
${input.originalPrompt}

CURRENT NODES:
${JSON.stringify(input.currentNodes, null, 2)}

CURRENT EDGES:
${JSON.stringify(input.currentEdges, null, 2)}

USER EDITS:
${input.editSummary}

Analyze the current state and suggest improvements.`;

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    config: {
      systemInstruction: REFINE_SYSTEM_PROMPT,
      temperature: parseFloat(process.env.AI_TEMPERATURE || "0.3"),
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: refineSchema,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Empty response from AI model");
  }

  const parsed = safeParseJSON(rawText);

  // Safety: cap new nodes
  if (parsed.addNodes.length > 10) {
    parsed.addNodes = parsed.addNodes.slice(0, 10);
  }

  return parsed;
}
