import { createSeededRandom } from "./seeded-random";

// Wobble offset helper — returns value in [-amount, +amount]
function wobble(rng: { next(): number }, amount: number): number {
  return (rng.next() - 0.5) * 2 * amount;
}

/**
 * Cloud shape — 6-8 bumps around a bounding box.
 * Returns an SVG path `d` string.
 */
export function generateCloudPath(w: number, h: number, seed: string): string {
  const rng = createSeededRandom(seed);
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 8;
  const ry = h / 2 - 8;
  const bumps = 7;
  const points: [number, number][] = [];

  for (let i = 0; i < bumps; i++) {
    const angle = (Math.PI * 2 * i) / bumps;
    const bumpScale = 0.85 + rng.next() * 0.3;
    const x = cx + Math.cos(angle) * rx * bumpScale + wobble(rng, 4);
    const y = cy + Math.sin(angle) * ry * bumpScale + wobble(rng, 4);
    points.push([x, y]);
  }

  return smoothClosedPath(points, rng);
}

/**
 * Imperfect circle — 8 points around circumference with wobble.
 */
export function generateCirclePath(
  cx: number,
  cy: number,
  r: number,
  seed: string,
): string {
  const rng = createSeededRandom(seed);
  const segments = 8;
  const points: [number, number][] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (Math.PI * 2 * i) / segments;
    const rWobble = r + wobble(rng, 5);
    points.push([
      cx + Math.cos(angle) * rWobble + wobble(rng, 3),
      cy + Math.sin(angle) * rWobble + wobble(rng, 3),
    ]);
  }

  return smoothClosedPath(points, rng);
}

/**
 * Uneven rounded rectangle — 8 points with wobble.
 */
export function generateRoundedRectPath(
  w: number,
  h: number,
  r: number,
  seed: string,
): string {
  const rng = createSeededRandom(seed);
  const inset = r;
  const wb = 4;

  // 8 points: 2 per side, going clockwise from top-left
  const points: [number, number][] = [
    [inset + wobble(rng, wb), wobble(rng, wb)],
    [w - inset + wobble(rng, wb), wobble(rng, wb)],
    [w + wobble(rng, wb), inset + wobble(rng, wb)],
    [w + wobble(rng, wb), h - inset + wobble(rng, wb)],
    [w - inset + wobble(rng, wb), h + wobble(rng, wb)],
    [inset + wobble(rng, wb), h + wobble(rng, wb)],
    [wobble(rng, wb), h - inset + wobble(rng, wb)],
    [wobble(rng, wb), inset + wobble(rng, wb)],
  ];

  return smoothClosedPath(points, rng);
}

/**
 * Wobbly line through a set of points — hand-drawn feel.
 */
export function generateWobblyLine(
  points: [number, number][],
  seed: string,
): string {
  if (points.length < 2) return "";
  const rng = createSeededRandom(seed);
  const wb = 3;

  let d = `M ${points[0][0] + wobble(rng, wb)} ${points[0][1] + wobble(rng, wb)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev[0] + curr[0]) / 2 + wobble(rng, wb * 1.5);
    const my = (prev[1] + curr[1]) / 2 + wobble(rng, wb * 1.5);
    d += ` Q ${mx} ${my} ${curr[0] + wobble(rng, wb)} ${curr[1] + wobble(rng, wb)}`;
  }

  return d;
}

// Smooth closed path through points using cubic bezier curves
function smoothClosedPath(
  points: [number, number][],
  _rng: { next(): number },
): string {
  const n = points.length;
  if (n < 3) return "";

  let d = `M ${points[0][0]} ${points[0][1]}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }

  d += " Z";
  return d;
}
