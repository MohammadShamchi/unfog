import { ANALYSIS_SYSTEM_PROMPT } from "./prompts";
import { createProviderFromConfig, safeParseJSON, resolveTemperature } from "./client";
import type { AnalysisResponse, AIConfig } from "@/types/analysis";

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
            enum: ["problem", "cause", "solution", "context", "idea"],
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

async function callAnalysis(
  userPrompt: string,
  config?: AIConfig,
): Promise<AnalysisResponse> {
  const provider = createProviderFromConfig(config);
  const rawText = await provider.generate({
    systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    userMessage: userPrompt,
    maxOutputTokens: 4096,
    temperature: resolveTemperature(config),
    responseSchema: analysisSchema,
  });

  return safeParseJSON<AnalysisResponse>(rawText);
}

export async function analyzeProblem(
  userPrompt: string,
  config?: AIConfig,
): Promise<AnalysisResponse> {
  let parsed: AnalysisResponse;
  try {
    parsed = await callAnalysis(userPrompt, config);
  } catch (firstError) {
    console.warn("[Unfog AI] First attempt failed, retrying:", firstError);
    parsed = await callAnalysis(userPrompt, config);
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
