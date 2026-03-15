"use client";

import { useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type NodeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DotGridBackground } from "./DotGridBackground";
import { ThinkingOverlay } from "./ThinkingOverlay";
import { EmptyState } from "./EmptyState";
import { SkeletonNodes } from "./SkeletonNodes";
import { IntakeOverlay } from "./IntakeOverlay";
import { LabeledEdge } from "./LabeledEdge";
import { nodeTypes } from "./InsightNode";
import { useCanvasStore } from "@/stores/canvas-store";
import { useIntakeStore } from "@/stores/intake-store";
import { soundEngine } from "@/lib/sound/sound-engine";
import { NODE_COLORS } from "@/types/canvas";
import type { InsightNode as InsightNodeType } from "@/types/canvas";
import type { NodeType } from "@/types/analysis";

const edgeTypes = { smoothstep: LabeledEdge };

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useCanvasStore();
  const fitViewTrigger = useCanvasStore((s) => s._fitViewTrigger);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const intakeStatus = useIntakeStore((s) => s.status);
  const showIntake = intakeStatus === "assessing" || intakeStatus === "asking" || intakeStatus === "answering";

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
    (changes: NodeChange<InsightNodeType>[]) => {
      const removeChanges = changes.filter((c) => c.type === "remove");
      const otherChanges = changes.filter((c) => c.type !== "remove");

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
      style: { stroke: "var(--border)", strokeWidth: 1.5 },
      labelStyle: {
        fill: "var(--text-secondary)",
        fontSize: 11,
        fontFamily: "var(--font-body)",
      },
      labelBgStyle: {
        fill: "var(--bg-surface)",
        fillOpacity: 0.8,
      },
    }),
    [],
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
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          position="bottom-left"
          nodeColor={miniMapNodeColor}
          maskColor="rgba(14, 16, 19, 0.8)"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        />
      </ReactFlow>

      <ThinkingOverlay />
      <AnimatePresence mode="wait">
        {showIntake && <IntakeOverlay key="intake" />}
        {!showIntake && nodes.length === 0 && !isLoading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="contents"
          >
            <EmptyState />
          </motion.div>
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

      {/* Add node button */}
      <button
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-display text-xs transition-colors hover:text-text-primary"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
        }}
        onClick={handleAddNode}
      >
        <Plus size={14} />
        Add node
      </button>
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
