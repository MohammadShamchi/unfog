import { useMotionValue } from "framer-motion";

/**
 * Returns a static MotionValue of 0 — no floating animation.
 * Kept as a stub so all consumers (node components via useNodeInteraction)
 * continue to work without changes.
 */
export function useFloatingMotion(_id: string, _paused: boolean) {
  return useMotionValue(0);
}
