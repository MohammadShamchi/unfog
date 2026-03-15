export interface GenerateOptions {
  systemPrompt: string;
  userMessage: string;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
  temperature?: number;
}

export interface AIProviderAdapter {
  generate(options: GenerateOptions): Promise<string>;
}
