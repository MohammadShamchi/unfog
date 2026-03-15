import { NextRequest, NextResponse } from "next/server";

interface ModelInfo {
  id: string;
  name: string;
}

async function fetchGeminiModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();

  return (data.models || [])
    .filter((m: { supportedGenerationMethods?: string[] }) =>
      m.supportedGenerationMethods?.includes("generateContent")
    )
    .map((m: { name: string; displayName: string }) => ({
      id: m.name.replace("models/", ""),
      name: m.displayName,
    }));
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();

  return (data.data || [])
    .filter((m: { id: string }) =>
      m.id.startsWith("gpt-") || m.id.startsWith("o") || m.id.startsWith("chatgpt-")
    )
    .map((m: { id: string }) => ({ id: m.id, name: m.id }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "X-Api-Key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();

  return (data.data || [])
    .map((m: { id: string; display_name?: string }) => ({
      id: m.id,
      name: m.display_name || m.id,
    }));
}

async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json();

  return (data.data || [])
    .map((m: { id: string; name: string }) => ({
      id: m.id,
      name: m.name || m.id,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: "Missing provider" }, { status: 400 });
    }

    let models: ModelInfo[];

    switch (provider) {
      case "gemini":
        if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 400 });
        models = await fetchGeminiModels(apiKey);
        break;
      case "openai":
        if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 400 });
        models = await fetchOpenAIModels(apiKey);
        break;
      case "anthropic":
        if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 400 });
        models = await fetchAnthropicModels(apiKey);
        break;
      case "openrouter":
        models = await fetchOpenRouterModels();
        break;
      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error("[Unfog Models] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
