"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useSoundStore } from "@/stores/sound-store";
import { soundEngine } from "@/lib/sound/sound-engine";

export function useSoundEffects() {
  const nodes = useCanvasStore((s) => s.nodes);
  const prevCountRef = useRef(nodes.length);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = nodes.length;
    prevCountRef.current = currentCount;

    if (!useSoundStore.getState().enabled) return;
    if (!useSoundStore.getState().initialized) return;

    if (currentCount > prevCount) {
      soundEngine.playNodeCreate();
    } else if (currentCount < prevCount) {
      soundEngine.playNodeDelete();
    }
  }, [nodes.length]);
}
