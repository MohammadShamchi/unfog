import { CLARIFY_SYSTEM_PROMPT } from "./prompts";
import { createProviderFromConfig, safeParseJSON, resolveTemperature } from "./client";
import type { AIConfig } from "@/types/analysis";

interface ClarifyMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClarifyResponse {
  question: string | null;
  ready: boolean;
}

const clarifySchema = {
  type: "object" as const,
  properties: {
    question: { type: "string" as const },
    ready: { type: "boolean" as const },
  },
  required: ["ready"],
};

export async function clarifyIntake(
  prompt: string,
  conversation: ClarifyMessage[],
  config?: AIConfig,
): Promise<ClarifyResponse> {
  const provider = createProviderFromConfig(config);

  // Build conversation context
  let userMessage = `Original problem:\n${prompt}`;
  if (conversation.length > 0) {
    userMessage += "\n\nConversation so far:";
    for (const msg of conversation) {
      userMessage += `\n${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`;
    }
    userMessage += "\n\nAsk the next clarifying question, or set ready=true if you have enough context.";
  }

  const rawText = await provider.generate({
    systemPrompt: CLARIFY_SYSTEM_PROMPT,
    userMessage,
    maxOutputTokens: 1024,
    temperature: resolveTemperature(config),
    responseSchema: clarifySchema,
  });

  return safeParseJSON<ClarifyResponse>(rawText);
}
