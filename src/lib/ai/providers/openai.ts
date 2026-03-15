import OpenAI from "openai";
import type { AIProviderAdapter, GenerateOptions } from "./types";

export class OpenAIAdapter implements AIProviderAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userMessage },
    ];

    const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxOutputTokens,
    };

    if (options.responseSchema) {
      requestParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: options.responseSchema,
          strict: false,
        },
      };
    } else {
      requestParams.response_format = { type: "json_object" };
    }

    const response = await this.client.chat.completions.create(requestParams);
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    return text;
  }
}
