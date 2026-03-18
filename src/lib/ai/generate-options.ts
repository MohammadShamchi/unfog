import { createProviderFromConfig, safeParseJSON, resolveTemperature } from "./client";
import { OPTIONS_SYSTEM_PROMPT } from "./prompts";
import type { OptionsRequest, OptionsResponse, AIConfig } from "@/types/analysis";

const optionsSchema = {
  type: "object" as const,
  properties: {
    options: {
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
          sentiment: {
            type: "string" as const,
            enum: ["positive", "negative"],
          },
          parentOptionId: { type: "string" as const },
        },
        required: ["id", "type", "label", "description", "sentiment"],
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
  required: ["options", "edges"],
};

export async function generateOptions(input: OptionsRequest, config?: AIConfig): Promise<OptionsResponse> {
  const provider = createProviderFromConfig(config);

  const userMessage = `SELECTED NODE:
ID: ${input.nodeId}
Type: ${input.nodeType}
Label: ${input.nodeLabel}
Description: ${input.nodeDescription}

ORIGINAL PROMPT:
${input.originalPrompt}

CURRENT MAP NODES:
${JSON.stringify(input.currentNodes, null, 2)}

CURRENT MAP EDGES:
${JSON.stringify(input.currentEdges, null, 2)}

Generate 2-3 alternative approaches for this node, each with 1 risk/downside.`;

  const rawText = await provider.generate({
    systemPrompt: OPTIONS_SYSTEM_PROMPT,
    userMessage,
    maxOutputTokens: 2048,
    temperature: resolveTemperature(config),
    responseSchema: optionsSchema,
  });

  const parsed = safeParseJSON<OptionsResponse>(rawText);

  // Cap at 3 alternatives + 3 risks = 6 nodes max
  const positives = parsed.options.filter((o) => o.sentiment === "positive").slice(0, 3);
  const positiveIds = new Set(positives.map((o) => o.id));
  const negatives = parsed.options.filter(
    (o) => o.sentiment === "negative" && o.parentOptionId && positiveIds.has(o.parentOptionId)
  ).slice(0, 3);

  parsed.options = [...positives, ...negatives];

  // Filter edges to valid node IDs
  const validIds = new Set(parsed.options.map((o) => o.id));
  validIds.add(input.nodeId);
  parsed.edges = parsed.edges.filter(
    (e) => validIds.has(e.source) && validIds.has(e.target)
  );

  return parsed;
}
