"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";
import { soundEngine } from "@/lib/sound/sound-engine";

export function useKeyboardShortcuts(onShowHelp: () => void, onShowSettings?: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName;

      // Escape → exit focus (check before other handlers, works even in inputs)
      if (e.key === "Escape") {
        const focusState = useFocusStore.getState();
        if (focusState.focusedNodeId) {
          e.preventDefault();
          focusState.exitFocus();
          return;
        }
      }

      // Cmd+, → open settings (works even in inputs)
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onShowSettings?.();
        return;
      }

      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // ? → show shortcuts
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      // F → toggle focus on selected node
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const selectedId = useCanvasStore.getState().selectedNodeId;
        const focusState = useFocusStore.getState();

        if (focusState.focusedNodeId) {
          e.preventDefault();
          focusState.exitFocus();
          return;
        }

        if (selectedId) {
          e.preventDefault();
          focusState.enterFocus(selectedId);
          return;
        }
      }

      // Cmd+Z → undo
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        useCanvasStore.getState().undo();
        soundEngine.playUndo();
        return;
      }

      // Cmd+Shift+Z → redo
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        useCanvasStore.getState().redo();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onShowHelp, onShowSettings]);
}
