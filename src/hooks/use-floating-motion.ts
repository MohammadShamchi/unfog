import { useEffect, useRef } from "react";
import { useMotionValue } from "framer-motion";

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns a MotionValue<number> that oscillates between 0 and -3
 * using a sine wave driven by requestAnimationFrame.
 * Each node gets a unique duration (3–5s) and phase offset based on its id.
 * When paused (dragging or reduced motion), smoothly returns to 0.
 */
export function useFloatingMotion(id: string, paused: boolean) {
  const y = useMotionValue(0);
  const rafRef = useRef<number>(0);

  const hash = hashId(id);
  const duration = 3 + (hash % 2001) / 1000; // 3–5s
  const phase = ((hash >> 8) % 1000) / 1000; // 0–1 phase offset

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(rafRef.current);
      // Smoothly settle to 0 — just set it, the MotionValue handles it
      y.set(0);
      return;
    }

    const periodMs = duration * 1000;
    const phaseOffset = phase * periodMs;

    function tick(time: number) {
      const t = (time + phaseOffset) % periodMs;
      const progress = t / periodMs;
      const value = -3 * Math.sin(progress * Math.PI * 2);
      y.set(value);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, duration, phase, y]);

  return y;
}
