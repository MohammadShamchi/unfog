import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import type { AnalysisResponse, RefineResponse } from "@/types/analysis";
import type { NodeType } from "@/types/analysis";
import type { InsightNode, InsightEdge, InsightNodeData, EditEvent } from "@/types/canvas";
import { layoutAnalysis, layoutNewNodes } from "@/lib/layout/dagre-layout";
import { useUndoStore } from "./undo-store";

function snapshot() {
  const { nodes, edges } = useCanvasStore.getState();
  useUndoStore.getState().pushSnapshot({
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  });
}

interface CanvasState {
  nodes: InsightNode[];
  edges: InsightEdge[];
  summary: string;
  originalPrompt: string;
  editHistory: EditEvent[];
  isRefining: boolean;
  isLoading: boolean;
  isFogged: boolean;
  _fitViewTrigger: number;

  // Core
  setAnalysis: (analysis: AnalysisResponse, prompt: string) => void;
  onNodesChange: (changes: NodeChange<InsightNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<InsightEdge>[]) => void;

  // Editing
  updateNodeData: (nodeId: string, updates: Partial<InsightNodeData>) => void;
  deleteNode: (nodeId: string) => { node: InsightNode; edges: InsightEdge[] } | null;
  restoreNode: (node: InsightNode, edges: InsightEdge[]) => void;
  changeNodeType: (nodeId: string, newType: NodeType) => void;
  clearEditHistory: () => void;

  // Manual creation (Spec 07)
  addNode: (position: { x: number; y: number }) => void;
  addEdge: (source: string, target: string) => void;
  updateEdgeLabel: (edgeId: string, newLabel: string) => void;

  // Refinement
  setRefining: (v: boolean) => void;
  applyRefinement: (response: RefineResponse) => void;

  // Fog
  toggleFog: () => void;

  // Import / Reset
  importAnalysis: (data: {
    nodes: InsightNode[];
    edges: InsightEdge[];
    summary: string;
    prompt: string;
  }) => void;
  resetCanvas: () => void;
  setLoading: (v: boolean) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  summary: "",
  originalPrompt: "",
  editHistory: [],
  isRefining: false,
  isLoading: false,
  isFogged: false,
  _fitViewTrigger: 0,

  setAnalysis: (analysis, prompt) => {
    const { nodes, edges } = layoutAnalysis(analysis);
    set((state) => ({
      nodes,
      edges,
      summary: analysis.summary,
      originalPrompt: prompt,
      editHistory: [],
      isLoading: false,
      isFogged: true,
      _fitViewTrigger: state._fitViewTrigger + 1,
    }));
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    // Track edge deletions in editHistory before applying
    const state = get();
    const removeChanges = changes.filter((c) => c.type === "remove");
    const events: EditEvent[] = [];

    for (const change of removeChanges) {
      if (change.type === "remove") {
        const edge = state.edges.find((e) => e.id === change.id);
        if (edge) {
          snapshot();
          events.push({
            type: "edge_deleted",
            source: edge.source,
            target: edge.target,
          });
        }
      }
    }

    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      editHistory: [...state.editHistory, ...events],
    }));
  },

  updateNodeData: (nodeId, updates) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    snapshot();

    const events: EditEvent[] = [];
    if (updates.label !== undefined && updates.label !== node.data.label) {
      events.push({
        type: "label_changed",
        nodeId,
        from: node.data.label,
        to: updates.label,
      });
    }
    if (updates.description !== undefined && updates.description !== node.data.description) {
      events.push({
        type: "description_changed",
        nodeId,
        from: node.data.description,
        to: updates.description,
      });
    }

    set({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
      ),
      editHistory: [...state.editHistory, ...events],
    });
  },

  deleteNode: (nodeId) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    snapshot();

    const connectedEdges = state.edges.filter(
      (e) => e.source === nodeId || e.target === nodeId
    );

    set({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      editHistory: [
        ...state.editHistory,
        { type: "node_deleted", nodeId, label: node.data.label },
      ],
    });

    return { node, edges: connectedEdges };
  },

  restoreNode: (node, edges) => {
    snapshot();
    set((state) => ({
      nodes: [...state.nodes, node],
      edges: [...state.edges, ...edges],
      editHistory: state.editHistory.filter(
        (e) => !(e.type === "node_deleted" && e.nodeId === node.id)
      ),
    }));
  },

  changeNodeType: (nodeId, newType) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node || node.data.nodeType === newType) return;

    snapshot();

    set({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, nodeType: newType } } : n
      ),
      editHistory: [
        ...state.editHistory,
        { type: "type_changed", nodeId, from: node.data.nodeType, to: newType },
      ],
    });
  },

  clearEditHistory: () => set({ editHistory: [] }),

  // Spec 07: Manual node creation
  addNode: (position) => {
    snapshot();
    const state = get();
    const maxN = state.nodes.reduce((max, n) => {
      const match = n.id.match(/^node_(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = `node_${maxN + 1}`;

    const newNode: InsightNode = {
      id: newId,
      type: "insight",
      position,
      data: {
        label: "New node",
        description: "Double-click to edit",
        nodeType: "context",
      },
    };

    set({
      nodes: [...state.nodes, newNode],
      editHistory: [
        ...state.editHistory,
        { type: "node_created", nodeId: newId },
      ],
    });
  },

  // Spec 07: Manual edge creation
  addEdge: (source, target) => {
    const state = get();
    const exists = state.edges.some(
      (e) => e.source === source && e.target === target
    );
    if (exists) return;

    snapshot();

    const newEdge: InsightEdge = {
      id: `edge_manual_${Date.now()}`,
      source,
      target,
      type: "smoothstep",
    };

    set({
      edges: [...state.edges, newEdge],
      editHistory: [
        ...state.editHistory,
        { type: "edge_created", source, target },
      ],
    });
  },

  // Spec 08: Edge label editing
  updateEdgeLabel: (edgeId, newLabel) => {
    const state = get();
    const edge = state.edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const oldLabel = typeof edge.label === "string" ? edge.label : "";
    if (oldLabel === newLabel) return;

    snapshot();

    set({
      edges: state.edges.map((e) =>
        e.id === edgeId
          ? { ...e, label: newLabel || undefined }
          : e
      ),
      editHistory: [
        ...state.editHistory,
        { type: "edge_label_changed", edgeId, from: oldLabel, to: newLabel },
      ],
    });
  },

  setRefining: (v) => set({ isRefining: v }),

  applyRefinement: (response) => {
    snapshot();
    const state = get();
    let nodes = [...state.nodes];
    let edges = [...state.edges];

    // 1. Remove nodes
    const removeIds = new Set(response.removeNodeIds);
    nodes = nodes.filter((n) => !removeIds.has(n.id));
    edges = edges.filter(
      (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
    );

    // 2. Update existing nodes
    for (const update of response.updateNodes) {
      nodes = nodes.map((n) => {
        if (n.id !== update.id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            ...(update.label !== undefined && { label: update.label }),
            ...(update.description !== undefined && { description: update.description }),
            ...(update.type !== undefined && { nodeType: update.type }),
          },
        };
      });
    }

    // 3. Remove edges
    for (const re of response.removeEdges) {
      edges = edges.filter(
        (e) => !(e.source === re.source && e.target === re.target)
      );
    }

    // 4. Create new edges
    const ts = Date.now();
    const newEdges: InsightEdge[] = response.addEdges.map((e, i) => ({
      id: `edge_new_${ts}_${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      label: e.label,
    }));

    // 5. Add new nodes with layout (needs all edges for positioning)
    if (response.addNodes.length > 0) {
      const allEdges = [...edges, ...newEdges];
      const newPositioned = layoutNewNodes(nodes, response.addNodes, allEdges);
      nodes = [...nodes, ...newPositioned];
    }

    // 6. Add new edges
    edges = [...edges, ...newEdges];

    set((s) => ({
      nodes,
      edges,
      summary: response.summary || state.summary,
      editHistory: [],
      isRefining: false,
      isFogged: true,
      _fitViewTrigger: s._fitViewTrigger + 1,
    }));
  },

  toggleFog: () => set((s) => ({ isFogged: !s.isFogged })),

  importAnalysis: (data) => {
    useUndoStore.getState().clear();
    set({
      nodes: data.nodes,
      edges: data.edges,
      summary: data.summary,
      originalPrompt: data.prompt,
      editHistory: [],
      isFogged: false,
    });
  },

  // Spec 06: Reset
  resetCanvas: () => {
    useUndoStore.getState().clear();
    set({
      nodes: [],
      edges: [],
      summary: "",
      originalPrompt: "",
      editHistory: [],
      isRefining: false,
      isLoading: false,
      isFogged: false,
    });
  },

  setLoading: (v) => set({ isLoading: v }),

  // Spec 10: Undo/Redo
  undo: () => {
    const { nodes, edges } = get();
    const current = { nodes: structuredClone(nodes), edges: structuredClone(edges) };
    const prev = useUndoStore.getState().undo(current);
    if (!prev) return;
    set({ nodes: prev.nodes, edges: prev.edges });
  },

  redo: () => {
    const { nodes, edges } = get();
    const current = { nodes: structuredClone(nodes), edges: structuredClone(edges) };
    const next = useUndoStore.getState().redo(current);
    if (!next) return;
    set({ nodes: next.nodes, edges: next.edges });
  },
}));
