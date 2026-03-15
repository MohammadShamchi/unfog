import { useSettingsStore } from "@/stores/settings-store";
import type { AIConfig } from "@/types/analysis";

export function getAIConfig(): AIConfig | undefined {
  if (typeof window === "undefined") return undefined;
  const store = useSettingsStore.getState();
  if (!store.isConfigured()) return undefined;
  return store.getConfig();
}

export async function apiPost(url: string, body: Record<string, unknown>): Promise<Response> {
  const aiConfig = getAIConfig();
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, aiConfig }),
  });
}

export async function apiPostWithRetry(
  url: string,
  body: Record<string, unknown>,
  retries = 1,
): Promise<Response> {
  try {
    return await apiPost(url, body);
  } catch (error) {
    if (retries > 0) return apiPostWithRetry(url, body, retries - 1);
    throw error;
  }
}
