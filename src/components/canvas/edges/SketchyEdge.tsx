"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { generateRoughLine, generateRoughArrowhead } from "@/lib/sketch/rough-shapes";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";

export function SketchyEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
}: EdgeProps) {
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

  const angle = Math.atan2(targetY - midY, targetX - midX);
  const arrowPath = generateRoughArrowhead(targetX, targetY, angle, id);

  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const labelText = typeof label === "string" ? label : "";

  // Focus mode dimming
  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);
  const branchNodeIds = useFocusStore((s) => s.branchNodeIds);
  const isFocusActive = focusedNodeId !== null;
  const isEdgeInBranch = branchNodeIds.includes(source) && branchNodeIds.includes(target);
  const isDimmed = isFocusActive && !isEdgeInBranch;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(labelText);
    setEditing(true);
  }, [labelText]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== labelText) {
      useCanvasStore.getState().updateEdgeLabel(id, trimmed);
    }
  }, [draft, labelText, id]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  const edgeOpacity = isDimmed ? 0.08 : 1;

  return (
    <>
      <g style={{ opacity: edgeOpacity, transition: "opacity 0.3s" }}>
        <path
          d={roughPath}
          fill="none"
          stroke="var(--edge-color)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <path
          d={arrowPath}
          fill="none"
          stroke="var(--edge-color)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      </g>

      {/* Invisible hit area */}
      <path
        d={roughPath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEdit();
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
        >
          {isDimmed ? null : editing ? (
            <input
              ref={inputRef}
              dir="auto"
              className="rounded px-1.5 py-0.5 font-body outline-none"
              style={{
                fontSize: 11,
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--accent)",
                color: "var(--text-primary)",
                minWidth: 60,
                maxWidth: 150,
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") cancel();
              }}
              onBlur={commit}
            />
          ) : labelText ? (
            <span
              dir="auto"
              className="rounded-sm px-1.5 py-0.5 font-body cursor-default"
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              {labelText}
            </span>
          ) : hovered ? (
            <span
              className="rounded px-1.5 py-0.5 font-body cursor-default"
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                opacity: 0.7,
              }}
            >
              add label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
