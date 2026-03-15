import { GoogleGenAI } from "@google/genai";
import type { AIProviderAdapter, GenerateOptions } from "./types";

export class GeminiAdapter implements AIProviderAdapter {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: options.userMessage }] }],
      config: {
        systemInstruction: options.systemPrompt,
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: options.responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  }
}
