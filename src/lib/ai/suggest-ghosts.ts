import { getClient, safeParseJSON, getModel, getTemperature } from "./client";
import { GHOST_SUGGESTION_PROMPT } from "./prompts";
import type { SuggestGhostsRequest, SuggestGhostsResponse } from "@/types/analysis";

const ghostSchema = {
  type: "object" as const,
  properties: {
    suggestions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          type: {
            type: "string" as const,
            enum: ["problem", "cause", "solution", "context"],
          },
          questionText: { type: "string" as const },
          label: { type: "string" as const },
          description: { type: "string" as const },
          connectTo: { type: "string" as const },
        },
        required: ["id", "type", "questionText", "label", "description", "connectTo"],
      },
    },
  },
  required: ["suggestions"],
};

export async function suggestGhosts(
  input: SuggestGhostsRequest
): Promise<SuggestGhostsResponse> {
  const client = getClient();
  const model = getModel();

  const userMessage = `ORIGINAL PROMPT:
${input.originalPrompt}

CURRENT MAP NODES:
${JSON.stringify(input.currentNodes, null, 2)}

CURRENT MAP EDGES:
${JSON.stringify(input.currentEdges, null, 2)}

${input.dismissedTopics.length > 0 ? `DISMISSED TOPICS (do not suggest these):\n${input.dismissedTopics.join("\n")}` : ""}

Suggest 2-4 things the user hasn't considered.`;

  try {
    const response = await client.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: GHOST_SUGGESTION_PROMPT,
        temperature: getTemperature(),
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: ghostSchema,
      },
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Empty response from AI model");
    const parsed = safeParseJSON<SuggestGhostsResponse>(rawText);

    // Cap at 4
    if (parsed.suggestions.length > 4) {
      parsed.suggestions = parsed.suggestions.slice(0, 4);
    }

    // Validate connectTo references
    const nodeIds = new Set(input.currentNodes.map((n) => n.id));
    parsed.suggestions = parsed.suggestions.filter((s) => nodeIds.has(s.connectTo));

    return parsed;
  } catch (error) {
    console.warn("[Unfog AI Ghosts] Failed:", error);
    return { suggestions: [] };
  }
}
