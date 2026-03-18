"use client";

import { memo } from "react";
import {
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { generateRoughLine } from "@/lib/sketch/rough-shapes";

function SketchEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
}: EdgeProps) {
  // Get bezier control points, then wobble the line
  const [, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const roughPath = generateRoughLine(
    [
      [sourceX, sourceY],
      [midX, midY],
      [targetX, targetY],
    ],
    id,
  );

  return (
    <g>
      <path
        d={roughPath}
        fill="none"
        stroke="#3A3A3A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Simple arrowhead */}
      <circle cx={targetX} cy={targetY} r={3} fill="#3A3A3A" />
      {label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fill: "#666",
          }}
        >
          {String(label)}
        </text>
      )}
    </g>
  );
}

export const SketchEdge = memo(SketchEdgeComponent);
export const sketchEdgeTypes = { "sketch-edge": SketchEdge };
