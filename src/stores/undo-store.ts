import { create } from "zustand";
import type { InsightNode, InsightEdge } from "@/types/canvas";

interface Snapshot {
  nodes: InsightNode[];
  edges: InsightEdge[];
}

interface UndoState {
  past: Snapshot[];
  future: Snapshot[];
  pushSnapshot: (snapshot: Snapshot) => void;
  undo: (current: Snapshot) => Snapshot | null;
  redo: (current: Snapshot) => Snapshot | null;
  clear: () => void;
}

const MAX_STACK = 30;

export const useUndoStore = create<UndoState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (snapshot) => {
    set((state) => ({
      past: [...state.past.slice(-(MAX_STACK - 1)), snapshot],
      future: [],
    }));
  },

  undo: (current) => {
    const { past } = get();
    if (past.length === 0) return null;
    const snapshot = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, current],
    }));
    return snapshot;
  },

  redo: (current) => {
    const { future } = get();
    if (future.length === 0) return null;
    const snapshot = future[future.length - 1];
    set((state) => ({
      future: state.future.slice(0, -1),
      past: [...state.past, current],
    }));
    return snapshot;
  },

  clear: () => set({ past: [], future: [] }),
}));
