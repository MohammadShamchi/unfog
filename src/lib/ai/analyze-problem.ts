import { GoogleGenAI } from "@google/genai";
import { ANALYSIS_SYSTEM_PROMPT } from "./prompts";
import type { AnalysisResponse } from "@/types/analysis";

// ─── Schema for structured output enforcement ───
const analysisSchema = {
  type: "object" as const,
  properties: {
    summary: { type: "string" as const },
    nodes: {
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
    edges: {
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
  },
  required: ["summary", "nodes", "edges"],
};

// ─── Initialize client ───
function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Main analysis function ───
export async function analyzeProblem(
  userPrompt: string
): Promise<AnalysisResponse> {
  const client = getClient();
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    config: {
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      temperature: parseFloat(process.env.AI_TEMPERATURE || "0.3"),
      maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || "2000"),
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  // Parse the response — Gemini returns valid JSON when schema is enforced
  const text = response.text;
  if (!text) {
    throw new Error("Empty response from AI model");
  }

  const parsed: AnalysisResponse = JSON.parse(text);

  // Validate node count (safety rail)
  if (parsed.nodes.length > 15) {
    parsed.nodes = parsed.nodes.slice(0, 15);
    // Remove edges referencing deleted nodes
    const validIds = new Set(parsed.nodes.map((n) => n.id));
    parsed.edges = parsed.edges.filter(
      (e) => validIds.has(e.source) && validIds.has(e.target)
    );
  }

  return parsed;
}
