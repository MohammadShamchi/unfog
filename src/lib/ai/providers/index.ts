import type { AIConfig } from "@/types/analysis";
import type { AIProviderAdapter } from "./types";
import { GeminiAdapter } from "./gemini";
import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";
import { OpenRouterAdapter } from "./openrouter";

export function createProvider(config: AIConfig): AIProviderAdapter {
  switch (config.provider) {
    case "gemini":
      return new GeminiAdapter(config.apiKey, config.model);
    case "openai":
      return new OpenAIAdapter(config.apiKey, config.model);
    case "anthropic":
      return new AnthropicAdapter(config.apiKey, config.model);
    case "openrouter":
      return new OpenRouterAdapter(config.apiKey, config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
