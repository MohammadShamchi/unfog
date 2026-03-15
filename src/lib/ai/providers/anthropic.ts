import Anthropic from "@anthropic-ai/sdk";
import type { AIProviderAdapter, GenerateOptions } from "./types";

export class AnthropicAdapter implements AIProviderAdapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<string> {
    let systemPrompt = options.systemPrompt;

    // Anthropic doesn't have native JSON schema — inject into system prompt
    if (options.responseSchema) {
      systemPrompt += `\n\nYou MUST respond with valid JSON matching this schema:\n${JSON.stringify(options.responseSchema, null, 2)}\n\nRespond with ONLY the JSON object, no markdown fences or extra text.`;
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxOutputTokens,
      temperature: options.temperature ?? 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: options.userMessage }],
    });

    const block = response.content[0];
    if (block.type !== "text" || !block.text) {
      throw new Error("Empty response from Anthropic");
    }
    return block.text;
  }
}
