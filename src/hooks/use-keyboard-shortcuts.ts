"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { soundEngine } from "@/lib/sound/sound-engine";

export function useKeyboardShortcuts(onShowHelp: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // ? → show shortcuts
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onShowHelp();
        return;
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
  }, [onShowHelp]);
}
