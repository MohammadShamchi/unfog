import rough from "roughjs";
import type { Options, Drawable, OpSet } from "roughjs/bin/core";

// Shared stateless generator — no DOM needed
const generator = rough.generator();

// --- Seed hashing (inlined from seeded-random.ts) ---

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// --- Path conversion ---

function opsToPath(ops: OpSet["ops"]): string {
  let d = "";
  for (const item of ops) {
    const p = item.data;
    switch (item.op) {
      case "move":
        d += `M${p[0]} ${p[1]} `;
        break;
      case "lineTo":
        d += `L${p[0]} ${p[1]} `;
        break;
      case "bcurveTo":
        d += `C${p[0]} ${p[1]}, ${p[2]} ${p[3]}, ${p[4]} ${p[5]} `;
        break;
    }
  }
  return d;
}

// --- Result interface ---

export interface RoughShapeResult {
  strokePaths: string[];
  fillPath: string;
}

function drawableToResult(drawable: Drawable): RoughShapeResult {
  const strokePaths: string[] = [];
  let fillPath = "";

  for (const set of drawable.sets) {
    const d = opsToPath(set.ops);
    if (set.type === "fillPath" || set.type === "fillSketch") {
      fillPath = d;
    } else if (set.type === "path") {
      strokePaths.push(d);
    }
  }

  return { strokePaths, fillPath };
}

// --- Base options ---

const BASE: Options = {
  roughness: 1,
  bowing: 1,
  strokeWidth: 1.5,
  curveFitting: 0.95,
  fillStyle: "solid",
  fill: "#000",
};

// --- Shape generators ---

export function generateRoughEllipse(
  w: number,
  h: number,
  seed: string,
): RoughShapeResult {
  const drawable = generator.ellipse(w / 2, h / 2, w - 16, h - 16, {
    ...BASE,
    seed: hashString(seed),
  });
  return drawableToResult(drawable);
}

export function generateRoughDiamond(
  w: number,
  h: number,
  seed: string,
): RoughShapeResult {
  const drawable = generator.polygon(
    [
      [w / 2, 4],
      [w - 4, h / 2],
      [w / 2, h - 4],
      [4, h / 2],
    ],
    {
      ...BASE,
      seed: hashString(seed),
      preserveVertices: true,
    },
  );
  return drawableToResult(drawable);
}

export function generateRoughRectangle(
  w: number,
  h: number,
  seed: string,
): RoughShapeResult {
  const drawable = generator.rectangle(4, 4, w - 8, h - 8, {
    ...BASE,
    seed: hashString(seed),
    strokeLineDash: [8, 4],
    disableMultiStroke: true,
  });
  return drawableToResult(drawable);
}

export function generateRoughCloud(
  w: number,
  h: number,
  seed: string,
): RoughShapeResult {
  const d = buildCloudPath(w, h);
  const drawable = generator.path(d, {
    ...BASE,
    seed: hashString(seed),
  });
  return drawableToResult(drawable);
}

// Clean cloud SVG arc path for rough.js to roughen
function buildCloudPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 10;
  const ry = h / 2 - 10;
  const bumps = 7;
  const points: [number, number][] = [];

  for (let i = 0; i < bumps; i++) {
    const angle = (Math.PI * 2 * i) / bumps;
    points.push([
      cx + Math.cos(angle) * rx,
      cy + Math.sin(angle) * ry,
    ]);
  }

  // Build smooth closed path through bump points using arcs
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < bumps; i++) {
    const next = points[(i + 1) % bumps];
    const curr = points[i];
    const mx = (curr[0] + next[0]) / 2;
    const my = (curr[1] + next[1]) / 2;
    // Bulge outward from center
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bulge = 18;
    const cpx = mx + (dx / dist) * bulge;
    const cpy = my + (dy / dist) * bulge;
    path += ` Q ${cpx} ${cpy} ${next[0]} ${next[1]}`;
  }
  path += " Z";
  return path;
}

// --- Edge generators ---

export function generateRoughLine(
  points: [number, number][],
  seed: string,
): string {
  if (points.length < 2) return "";
  const drawable = generator.linearPath(points, {
    roughness: 0.8,
    bowing: 1,
    strokeWidth: 1.2,
    seed: hashString(seed),
  });
  const pathSet = drawable.sets.find((s) => s.type === "path");
  return pathSet ? opsToPath(pathSet.ops) : "";
}

export function generateRoughArrowhead(
  targetX: number,
  targetY: number,
  angle: number,
  seed: string,
): string {
  const len = 8;
  const spread = Math.PI / 6;
  const p1: [number, number] = [
    targetX - len * Math.cos(angle - spread),
    targetY - len * Math.sin(angle - spread),
  ];
  const p2: [number, number] = [targetX, targetY];
  const p3: [number, number] = [
    targetX - len * Math.cos(angle + spread),
    targetY - len * Math.sin(angle + spread),
  ];

  const d1 = generator.linearPath([p1, p2], {
    roughness: 0.5,
    strokeWidth: 1.2,
    seed: hashString(seed),
  });
  const d2 = generator.linearPath([p3, p2], {
    roughness: 0.5,
    strokeWidth: 1.2,
    seed: hashString(seed + "_arrow"),
  });

  const path1 = d1.sets.find((s) => s.type === "path");
  const path2 = d2.sets.find((s) => s.type === "path");
  return (path1 ? opsToPath(path1.ops) : "") + (path2 ? opsToPath(path2.ops) : "");
}
