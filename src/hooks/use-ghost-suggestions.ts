"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useGhostStore } from "@/stores/ghost-store";
import { apiPost } from "@/lib/api-client";

export function useGhostSuggestions() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const originalPrompt = useCanvasStore((s) => s.originalPrompt);
  const prevNodeCount = useRef(0);
  const hasFired = useRef(false);

  useEffect(() => {
    // Detect analysis completion: node count went from 0 to >0 while not loading
    const wasEmpty = prevNodeCount.current === 0;
    prevNodeCount.current = nodes.length;

    if (!wasEmpty || nodes.length === 0 || isLoading) return;
    if (hasFired.current) return;
    hasFired.current = true;

    const timer = setTimeout(async () => {
      const ghostState = useGhostStore.getState();
      if (ghostState.isGenerating) return;

      ghostState.setGenerating(true);

      try {
        const currentNodes = nodes.map((n) => ({
          id: n.id,
          type: n.data.nodeType,
          label: n.data.label,
          description: n.data.description,
        }));
        const currentEdges = edges.map((e) => ({
          source: e.source,
          target: e.target,
          label: typeof e.label === "string" ? e.label : undefined,
        }));

        const res = await apiPost("/api/suggest", {
          originalPrompt,
          currentNodes,
          currentEdges,
          dismissedTopics: ghostState.dismissedTopics,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data?.suggestions?.length > 0) {
            useGhostStore.getState().setGhosts(data.data.suggestions);
          }
        }
      } catch {
        // Silent failure
      } finally {
        useGhostStore.getState().setGenerating(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [nodes, isLoading, edges, originalPrompt]);

  // Reset fired flag when canvas is cleared
  useEffect(() => {
    if (nodes.length === 0) {
      hasFired.current = false;
    }
  }, [nodes.length]);
}
