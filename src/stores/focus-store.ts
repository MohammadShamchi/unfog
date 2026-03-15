import { create } from "zustand";
import { getBranch } from "@/lib/graph/get-branch";
import { useCanvasStore } from "./canvas-store";

interface FocusState {
  focusedNodeId: string | null;
  branchNodeIds: string[];

  enterFocus: (nodeId: string) => void;
  exitFocus: () => void;
  recalculateBranch: () => void;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  focusedNodeId: null,
  branchNodeIds: [],

  enterFocus: (nodeId) => {
    const { edges, nodes } = useCanvasStore.getState();
    // Verify node exists
    if (!nodes.find((n) => n.id === nodeId)) return;

    const branch = getBranch(nodeId, edges);
    set({
      focusedNodeId: nodeId,
      branchNodeIds: Array.from(branch),
    });
  },

  exitFocus: () => {
    set({ focusedNodeId: null, branchNodeIds: [] });
  },

  recalculateBranch: () => {
    const { focusedNodeId } = get();
    if (!focusedNodeId) return;

    const { edges, nodes } = useCanvasStore.getState();
    // Exit if focused node no longer exists
    if (!nodes.find((n) => n.id === focusedNodeId)) {
      set({ focusedNodeId: null, branchNodeIds: [] });
      return;
    }

    const branch = getBranch(focusedNodeId, edges);
    set({ branchNodeIds: Array.from(branch) });
  },
}));
