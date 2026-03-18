"use client";

import { useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeChange,
  type Connection,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DotGridBackground } from "./DotGridBackground";
import { ThinkingOverlay } from "./ThinkingOverlay";
import { SkeletonNodes } from "./SkeletonNodes";
import { GhostNode } from "./GhostNode";
import { LabeledEdge } from "./LabeledEdge";
import { nodeTypes as insightNodeTypes } from "./InsightNode";
import { sketchNodeTypes } from "./SketchNode";
import { sketchEdgeTypes } from "./SketchEdge";
import { InputExperience } from "../input/InputExperience";
import { useCanvasStore } from "@/stores/canvas-store";
import { useGhostStore } from "@/stores/ghost-store";
import { useFocusStore } from "@/stores/focus-store";
import { useInputExperienceStore } from "@/stores/input-experience-store";
import { useGhostSuggestions } from "@/hooks/use-ghost-suggestions";
import { soundEngine } from "@/lib/sound/sound-engine";
import { NODE_COLORS } from "@/types/canvas";
import type { InsightNode as InsightNodeType } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";

const nodeTypes = { ...insightNodeTypes, ...sketchNodeTypes, ghost: GhostNode };
const edgeTypes = { smoothstep: LabeledEdge, ...sketchEdgeTypes };

function CanvasInner() {
  const { nodes: canvasNodes, edges, onNodesChange, onEdgesChange } = useCanvasStore();
  const fitViewTrigger = useCanvasStore((s) => s._fitViewTrigger);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const isFogged = useCanvasStore((s) => s.isFogged);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const inputPhase = useInputExperienceStore((s) => s.phase);
  const showInputExperience = inputPhase !== "complete";

  // Skip input experience if canvas already has nodes (returning user)
  useEffect(() => {
    if (canvasNodes.length > 0 && inputPhase !== "complete") {
      useInputExperienceStore.getState().setPhase("complete");
    }
  }, [canvasNodes.length, inputPhase]);

  // Ghost nodes (Spec 16)
  const ghosts = useGhostStore((s) => s.ghosts);
  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);
  const branchNodeIds = useFocusStore((s) => s.branchNodeIds);
  useGhostSuggestions();

  // Merge ghost nodes with canvas nodes
  const ghostFlowNodes = useMemo(() => {
    let filtered = ghosts;
    // Spec 17: only show ghosts whose connectTo is in the branch
    if (focusedNodeId) {
      const branchSet = new Set(branchNodeIds);
      filtered = ghosts.filter((g) => branchSet.has(g.connectTo));
    }
    return filtered.map((g) => ({
      id: g.id,
      type: "ghost" as const,
      position: { x: 0, y: 0 }, // Will be positioned by layout
      data: {
        ghostId: g.id,
        label: g.questionText,
        nodeType: g.type,
        description: g.description,
        connectTo: g.connectTo,
        realLabel: g.label,
        realDescription: g.description,
      },
    }));
  }, [ghosts, focusedNodeId, branchNodeIds]);

  const nodes = useMemo(
    () => [...canvasNodes, ...ghostFlowNodes] as Node[],
    [canvasNodes, ghostFlowNodes]
  );

  // Selection handler
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (selectedNodes.length === 1 && selectedNodes[0].type !== "ghost") {
        setSelectedNodeId(selectedNodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  useEffect(() => {
    if (fitViewTrigger > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    }
  }, [fitViewTrigger, fitView]);

  const miniMapNodeColor = useCallback(
    (node: { data?: Record<string, unknown> }) => {
      const nodeType = node.data?.nodeType as NodeType | undefined;
      return nodeType ? NODE_COLORS[nodeType] : "var(--border)";
    },
    [],
  );

  // Intercept node changes to route deletions through our store
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      // Filter out changes for ghost nodes — they are not managed by the store
      const ghostIds = new Set(useGhostStore.getState().ghosts.map((g) => g.id));
      const realChanges = changes.filter((c) => {
        if ("id" in c) return !ghostIds.has(c.id);
        return true;
      }) as NodeChange<InsightNodeType>[];

      const removeChanges = realChanges.filter((c) => c.type === "remove");
      const otherChanges = realChanges.filter((c) => c.type !== "remove");

      // Apply non-delete changes normally
      if (otherChanges.length > 0) {
        onNodesChange(otherChanges);
      }

      // Route deletions through our deleteNode (handles edges + history + undo)
      for (const change of removeChanges) {
        if (change.type === "remove") {
          const result = useCanvasStore.getState().deleteNode(change.id);
          if (result) {
            toast("Node deleted", {
              action: {
                label: "Undo",
                onClick: () => {
                  useCanvasStore.getState().restoreNode(result.node, result.edges);
                },
              },
              duration: 3000,
            });
          }
        }
      }
    },
    [onNodesChange],
  );

  // Spec 07: Handle edge connections
  const handleConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      useCanvasStore.getState().addEdge(connection.source, connection.target);
      soundEngine.playEdgeConnect();
    }
  }, []);

  // Spec 07: Add node at viewport center
  const handleAddNode = useCallback(() => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    useCanvasStore.getState().addNode(center);
    soundEngine.playNodeCreate();
  }, [screenToFlowPosition]);

  const defaultEdgeOpts = useMemo(
    () => ({
      type: "smoothstep" as const,
      style: {
        stroke: "var(--edge-color)",
        strokeWidth: 1.5,
        opacity: isFogged ? 0.3 : 1,
        transition: "opacity 0.4s",
      },
      labelStyle: {
        fill: "var(--text-secondary)",
        fontSize: 11,
        fontFamily: "var(--font-body)",
        opacity: isFogged ? 0.3 : 1,
        transition: "opacity 0.4s",
      },
      labelBgStyle: {
        fill: "var(--bg-surface)",
        fillOpacity: 0.8,
      },
    }),
    [isFogged],
  );

  return (
    <div
      className="relative h-full w-full"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        deleteKeyCode={["Backspace", "Delete"]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={defaultEdgeOpts}
      >
        <DotGridBackground />
        {!showInputExperience && (
          <Controls position="bottom-right" showInteractive={false} />
        )}
        {!showInputExperience && nodes.length >= 10 && (
          <MiniMap
            position="bottom-left"
            nodeColor={miniMapNodeColor}
            maskColor="var(--minimap-mask)"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              opacity: 0.6,
            }}
          />
        )}
      </ReactFlow>

      <ThinkingOverlay />

      {/* Spec 17: Focus exit pill */}
      {focusedNodeId && (
        <button
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs font-semibold transition-all hover:opacity-90"
          style={{
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
          }}
          onClick={() => useFocusStore.getState().exitFocus()}
        >
          Exit focus
        </button>
      )}
      <AnimatePresence mode="wait">
        {showInputExperience && nodes.length === 0 && !isLoading && (
          <InputExperience key="input-experience" />
        )}
        {isLoading && nodes.length === 0 && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="contents"
          >
            <SkeletonNodes />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add node button — hidden when no map or during input experience */}
      {!showInputExperience && (nodes.length > 0 || isLoading) && (
        <button
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-display text-xs transition-all opacity-60 hover:opacity-100 hover:text-text-primary"
          style={{
            backgroundColor: "transparent",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
          onClick={handleAddNode}
        >
          <Plus size={14} />
          Add node
        </button>
      )}
    </div>
  );
}

export function ProblemCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
