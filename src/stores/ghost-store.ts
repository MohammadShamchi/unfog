import { create } from "zustand";
import type { GhostSuggestion } from "@/types/analysis";
import { useCanvasStore } from "./canvas-store";
import { soundEngine } from "@/lib/sound/sound-engine";

const MAX_GHOSTS = 4;

interface GhostState {
  ghosts: GhostSuggestion[];
  dismissedTopics: string[];
  isGenerating: boolean;

  setGhosts: (ghosts: GhostSuggestion[]) => void;
  addGhosts: (ghosts: GhostSuggestion[]) => void;
  acceptGhost: (id: string) => void;
  dismissGhost: (id: string) => void;
  clearGhosts: () => void;
  setGenerating: (v: boolean) => void;
}

export const useGhostStore = create<GhostState>((set, get) => ({
  ghosts: [],
  dismissedTopics: [],
  isGenerating: false,

  setGhosts: (ghosts) => set({ ghosts: ghosts.slice(0, MAX_GHOSTS) }),

  addGhosts: (newGhosts) => {
    set((s) => ({
      ghosts: [...s.ghosts, ...newGhosts].slice(0, MAX_GHOSTS),
    }));
  },

  acceptGhost: (id) => {
    const { ghosts } = get();
    const ghost = ghosts.find((g) => g.id === id);
    if (!ghost) return;

    // Remove from ghosts
    set((s) => ({
      ghosts: s.ghosts.filter((g) => g.id !== id),
    }));

    // Create real node + edge in canvas store
    const canvasState = useCanvasStore.getState();
    const maxN = canvasState.nodes.reduce((max, n) => {
      const match = n.id.match(/^node_(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newNodeId = `node_${maxN + 1}`;

    canvasState.applyExploreResult(
      ghost.connectTo,
      [
        {
          id: newNodeId,
          type: ghost.type,
          label: ghost.label,
          description: ghost.description,
        },
      ],
      [{ source: ghost.connectTo, target: newNodeId }]
    );

    soundEngine.playNodeCreate();
  },

  dismissGhost: (id) => {
    const { ghosts } = get();
    const ghost = ghosts.find((g) => g.id === id);
    if (!ghost) return;

    set((s) => ({
      ghosts: s.ghosts.filter((g) => g.id !== id),
      dismissedTopics: [...s.dismissedTopics, ghost.questionText],
    }));

    soundEngine.playGhostDismiss();
  },

  clearGhosts: () => set({ ghosts: [], dismissedTopics: [], isGenerating: false }),

  setGenerating: (v) => set({ isGenerating: v }),
}));
