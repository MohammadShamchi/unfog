import { GoogleGenAI } from "@google/genai";

export function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenAI({ apiKey });
}

export function safeParseJSON<T>(raw: string): T {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  text = text.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}

export function getModel() {
  return process.env.AI_MODEL || "gemini-2.5-flash";
}

export function getTemperature() {
  return parseFloat(process.env.AI_TEMPERATURE || "0.3");
}

// Compact serialization — one line per node instead of pretty JSON
export function compactNodes(nodes: Array<{ id: string; type: string; label: string; description: string }>) {
  return nodes
    .map((n) => `${n.id} [${n.type}] "${n.label}" — ${n.description}`)
    .join("\n");
}

export function compactEdges(edges: Array<{ source: string; target: string; label?: string }>) {
  return edges
    .map((e) => `${e.source} → ${e.target}${e.label ? ` (${e.label})` : ""}`)
    .join("\n");
}

// Retry with exponential backoff — respects retry-after from 429 responses
export async function generateWithBackoff(
  client: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  tag: string,
  maxRetries = 2
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (error: unknown) {
      lastError = error;
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED"));

      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }

      // Parse retry delay from error message, fallback to exponential backoff
      let waitMs = Math.min(2000 * Math.pow(2, attempt), 30000);
      const retryMatch = error.message.match(/retryDelay.*?(\d+)s/);
      if (retryMatch) {
        waitMs = Math.min(parseInt(retryMatch[1], 10) * 1000, 60000);
      }

      console.warn(`${tag} Rate limited, waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${maxRetries}`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastError;
}
