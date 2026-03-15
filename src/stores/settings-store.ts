import { create } from "zustand";
import type { AIConfig } from "@/types/analysis";

type Provider = AIConfig["provider"];

interface SettingsState {
  provider: Provider;
  apiKey: string;
  model: string;
  temperature: number;
  setProvider: (provider: Provider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  isConfigured: () => boolean;
  getConfig: () => AIConfig;
}

function readPersisted<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return stored as unknown as T;
  }
}

function persist(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: readPersisted<Provider>("unfog:ai-provider", "gemini"),
  apiKey: readPersisted<string>("unfog:ai-key", ""),
  model: readPersisted<string>("unfog:ai-model", ""),
  temperature: readPersisted<number>("unfog:ai-temperature", 0.3),

  setProvider: (provider) => {
    set({ provider, model: "", apiKey: "" });
    persist("unfog:ai-provider", provider);
    persist("unfog:ai-model", "");
    persist("unfog:ai-key", "");
  },

  setApiKey: (apiKey) => {
    set({ apiKey });
    persist("unfog:ai-key", apiKey);
  },

  setModel: (model) => {
    set({ model });
    persist("unfog:ai-model", model);
  },

  setTemperature: (temperature) => {
    set({ temperature });
    persist("unfog:ai-temperature", temperature);
  },

  isConfigured: () => {
    const { apiKey, model } = get();
    return apiKey.length > 0 && model.length > 0;
  },

  getConfig: () => {
    const { provider, apiKey, model, temperature } = get();
    return { provider, apiKey, model, temperature };
  },
}));
