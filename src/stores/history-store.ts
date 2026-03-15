import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  prompt: string;
  summary: string;
  timestamp: number;
  nodeCount: number;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (data: Omit<HistoryEntry, "id" | "timestamp">) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (data) =>
        set((state) => ({
          entries: [
            {
              ...data,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
            ...state.entries,
          ].slice(0, 20),
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearHistory: () => set({ entries: [] }),
    }),
    { name: "unfog:history" }
  )
);
