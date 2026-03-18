"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface FogParticlesProps {
  active: boolean;
  direction: "inward" | "outward" | "none";
}

export function FogParticles({ active, direction }: FogParticlesProps) {
  const reducedMotion = useReducedMotion();

  if (!active || reducedMotion || direction === "none") return null;

  const animationName = direction === "inward" ? "fog-drift-in" : "fog-drift-out";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const size = 200 + (i % 3) * 120;
        const opacity = 0.03 + (i % 4) * 0.01;
        const delay = i * 0.8;
        // Position particles around edges
        const positions = [
          { top: "-10%", left: "-10%" },
          { top: "-10%", right: "-10%" },
          { bottom: "-10%", left: "-10%" },
          { bottom: "-10%", right: "-10%" },
          { top: "50%", left: "-15%" },
          { top: "50%", right: "-15%" },
          { top: "-15%", left: "50%" },
          { bottom: "-15%", left: "50%" },
          { top: "20%", left: "-10%" },
          { bottom: "20%", right: "-10%" },
        ];
        const pos = positions[i];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(95,224,193,${opacity}) 0%, transparent 70%)`,
              animation: `${animationName} ${4 + (i % 3)}s ${delay}s ease-in-out infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
