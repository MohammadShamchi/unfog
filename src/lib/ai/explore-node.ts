import { createProviderFromConfig, safeParseJSON, resolveTemperature } from "./client";
import { EXPLORE_SYSTEM_PROMPT } from "./prompts";
import type { ExploreRequest, ExploreResponse, AIConfig } from "@/types/analysis";

const exploreSchema = {
  type: "object" as const,
  properties: {
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
  required: ["nodes", "edges"],
};

export async function exploreNode(input: ExploreRequest, config?: AIConfig): Promise<ExploreResponse> {
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

Break down the selected node into 2-4 deeper sub-nodes.`;

  const rawText = await provider.generate({
    systemPrompt: EXPLORE_SYSTEM_PROMPT,
    userMessage,
    maxOutputTokens: 2048,
    temperature: resolveTemperature(config),
    responseSchema: exploreSchema,
  });

  const parsed = safeParseJSON<ExploreResponse>(rawText);

  // Cap at 4 nodes
  if (parsed.nodes.length > 4) {
    parsed.nodes = parsed.nodes.slice(0, 4);
    const validIds = new Set(parsed.nodes.map((n) => n.id));
    validIds.add(input.nodeId);
    parsed.edges = parsed.edges.filter(
      (e) => validIds.has(e.source) && validIds.has(e.target)
    );
  }

  return parsed;
}
