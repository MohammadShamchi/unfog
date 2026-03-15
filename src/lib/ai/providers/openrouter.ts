import OpenAI from "openai";
import type { AIProviderAdapter, GenerateOptions } from "./types";

export class OpenRouterAdapter implements AIProviderAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://unfog.app",
        "X-Title": "Unfog",
      },
    });
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<string> {
    let systemContent = options.systemPrompt;

    // OpenRouter JSON support varies by model — inject schema into prompt
    if (options.responseSchema) {
      systemContent += `\n\nYou MUST respond with valid JSON matching this schema:\n${JSON.stringify(options.responseSchema, null, 2)}\n\nRespond with ONLY the JSON object, no markdown fences or extra text.`;
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: options.userMessage },
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxOutputTokens,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenRouter");
    return text;
  }
}
