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

// ─── Robust JSON parsing (Gemini occasionally produces trailing commas / markdown fences) ───
function safeParseJSON(raw: string): AnalysisResponse {
  // Strip markdown code fences if present
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}

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

// ─── Single attempt ───
async function callAnalysis(
  client: GoogleGenAI,
  model: string,
  userPrompt: string,
): Promise<AnalysisResponse> {
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
      maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || "4096"),
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Empty response from AI model");
  }

  return safeParseJSON(rawText);
}

// ─── Main analysis function (retries once on parse failure) ───
export async function analyzeProblem(
  userPrompt: string,
): Promise<AnalysisResponse> {
  const client = getClient();
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  let parsed: AnalysisResponse;
  try {
    parsed = await callAnalysis(client, model, userPrompt);
  } catch (firstError) {
    console.warn("[Unfog AI] First attempt failed, retrying:", firstError);
    parsed = await callAnalysis(client, model, userPrompt);
  }

  // Validate node count (safety rail)
  if (parsed.nodes.length > 15) {
    parsed.nodes = parsed.nodes.slice(0, 15);
    const validIds = new Set(parsed.nodes.map((n) => n.id));
    parsed.edges = parsed.edges.filter(
      (e) => validIds.has(e.source) && validIds.has(e.target),
    );
  }

  return parsed;
}
