import rough from "roughjs";
import type { Options, Drawable, OpSet } from "roughjs/bin/core";

const generator = rough.generator();

const DEFAULT_STROKE_WIDTH = 1.5;
/** Hand-tuned default; Excalidraw scales user “roughness” — we use one profile for nodes. */
const BASE_ROUGHNESS = 1;
const BASE_BOWING = 1;
/** Below this adjusted value, Rough keeps polygon corners sharper (Excalidraw-style). */
const CARTOONIST_ROUGHNESS = 2;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Shrinks roughness for tiny shapes so strokes do not turn into noise (same idea as Excalidraw’s adjustRoughness).
 */
function adjustRoughness(width: number, height: number, roughness: number): number {
  const maxSize = Math.max(width, height);
  const minSize = Math.min(width, height);
  if (minSize >= 20 && maxSize >= 50) {
    return roughness;
  }
  return Math.min(roughness / (maxSize < 10 ? 3 : 2), 2.5);
}

function dashPatternDashed(strokeWidth: number): [number, number] {
  return [8, 8 + strokeWidth];
}

function fillWeightsForStroke(strokeWidth: number): Pick<Options, "fillWeight" | "hachureGap"> {
  return {
    fillWeight: strokeWidth / 2,
    hachureGap: strokeWidth * 4,
  };
}

function optionsEllipse(seed: string, width: number, height: number): Options {
  const strokeWidth = DEFAULT_STROKE_WIDTH;
  const roughness = adjustRoughness(width, height, BASE_ROUGHNESS);
  return {
    seed: hashString(seed),
    roughness,
    bowing: BASE_BOWING,
    strokeWidth,
    curveFitting: 1,
    fillStyle: "solid",
    fill: "#000",
    ...fillWeightsForStroke(strokeWidth),
  };
}

function optionsDiamondPolygon(seed: string, width: number, height: number): Options {
  const strokeWidth = DEFAULT_STROKE_WIDTH;
  const roughness = adjustRoughness(width, height, BASE_ROUGHNESS);
  return {
    seed: hashString(seed),
    roughness,
    bowing: BASE_BOWING,
    strokeWidth,
    curveFitting: 0.95,
    fillStyle: "solid",
    fill: "#000",
    ...fillWeightsForStroke(strokeWidth),
    preserveVertices: roughness < CARTOONIST_ROUGHNESS,
  };
}

function optionsContinuousPath(seed: string, width: number, height: number): Options {
  const strokeWidth = DEFAULT_STROKE_WIDTH;
  const roughness = adjustRoughness(width, height, BASE_ROUGHNESS);
  return {
    seed: hashString(seed),
    roughness,
    bowing: BASE_BOWING,
    strokeWidth,
    curveFitting: 0.96,
    fillStyle: "solid",
    fill: "#000",
    ...fillWeightsForStroke(strokeWidth),
    preserveVertices: true,
  };
}

function optionsRectangleDashed(seed: string, width: number, height: number): Options {
  const strokeWidth = DEFAULT_STROKE_WIDTH + 0.5;
  const roughness = adjustRoughness(width, height, BASE_ROUGHNESS);
  return {
    seed: hashString(seed),
    roughness,
    bowing: BASE_BOWING,
    strokeWidth,
    strokeLineDash: [...dashPatternDashed(DEFAULT_STROKE_WIDTH)],
    disableMultiStroke: true,
    curveFitting: 0.95,
    fillStyle: "solid",
    fill: "#000",
    ...fillWeightsForStroke(strokeWidth),
  };
}

/** Rounded rect in element-local coords (0..w, 0..h), same structure as Excalidraw’s round-rect path. */
function roundRectPath(width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  return `M ${r} 0 L ${width - r} 0 Q ${width} 0, ${width} ${r} L ${width} ${
    height - r
  } Q ${width} ${height}, ${width - r} ${height} L ${r} ${height} Q 0 ${height}, 0 ${
    height - r
  } L 0 ${r} Q 0 0, ${r} 0`;
}

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

/** Excalidraw-style ellipse: center at half box, full width/height (local coordinates). */
export function generateRoughEllipse(w: number, h: number, seed: string): RoughShapeResult {
  const drawable = generator.ellipse(w / 2, h / 2, w, h, optionsEllipse(seed, w, h));
  return drawableToResult(drawable);
}

/** Diamond vertices at box midpoints (matches Excalidraw’s sharp diamond polygon). */
export function generateRoughDiamond(w: number, h: number, seed: string): RoughShapeResult {
  const drawable = generator.polygon(
    [
      [w / 2, 0],
      [w, h / 2],
      [w / 2, h],
      [0, h / 2],
    ],
    optionsDiamondPolygon(seed, w, h),
  );
  return drawableToResult(drawable);
}

export type RoughRectangleStroke = "solid" | "dashed";

/**
 * Solid: rounded rectangle via SVG path + continuous-path Rough options (Excalidraw-style).
 * Dashed: sharp rectangle, dashed stroke, multi-stroke off (Excalidraw-style for non-solid).
 */
export function generateRoughRectangle(
  w: number,
  h: number,
  seed: string,
  /** Default dashed matches historical Unfog context frames; use `"solid"` for Excalidraw-like filled rounded rects. */
  strokeStyle: RoughRectangleStroke = "dashed",
): RoughShapeResult {
  if (strokeStyle === "dashed") {
    const drawable = generator.rectangle(0, 0, w, h, optionsRectangleDashed(seed, w, h));
    return drawableToResult(drawable);
  }

  const cornerRadius = Math.min(16, Math.min(w, h) * 0.12);
  const d = roundRectPath(w, h, cornerRadius);
  const drawable = generator.path(d, optionsContinuousPath(seed, w, h));
  return drawableToResult(drawable);
}

export function generateRoughCloud(w: number, h: number, seed: string): RoughShapeResult {
  const d = buildCloudPath(w, h);
  const drawable = generator.path(d, {
    ...optionsContinuousPath(seed, w, h),
    bowing: 0.85,
    roughness: adjustRoughness(w, h, BASE_ROUGHNESS * 0.92),
  });
  return drawableToResult(drawable);
}

function buildCloudPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 10;
  const ry = h / 2 - 10;
  const bumps = 7;
  const points: [number, number][] = [];

  for (let i = 0; i < bumps; i++) {
    const angle = (Math.PI * 2 * i) / bumps;
    points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }

  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < bumps; i++) {
    const next = points[(i + 1) % bumps];
    const curr = points[i];
    const mx = (curr[0] + next[0]) / 2;
    const my = (curr[1] + next[1]) / 2;
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

export function generateRoughLine(points: [number, number][], seed: string): string {
  if (points.length < 2) return "";
  let maxSpan = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    maxSpan = Math.max(maxSpan, Math.hypot(dx, dy));
  }
  const drawable = generator.linearPath(points, {
    roughness: Math.min(1, adjustRoughness(maxSpan, 8, 0.85)),
    bowing: 0.9,
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

  const lineOpts = {
    roughness: 0.45,
    strokeWidth: 1.2,
    seed: hashString(seed),
  };
  const d1 = generator.linearPath([p1, p2], lineOpts);
  const d2 = generator.linearPath([p3, p2], { ...lineOpts, seed: hashString(`${seed}_arrow`) });

  const path1 = d1.sets.find((s) => s.type === "path");
  const path2 = d2.sets.find((s) => s.type === "path");
  return (path1 ? opsToPath(path1.ops) : "") + (path2 ? opsToPath(path2.ops) : "");
}
