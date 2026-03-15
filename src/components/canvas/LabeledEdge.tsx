"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";

export function LabeledEdge({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const labelText = typeof label === "string" ? label : "";

  // Spec 17: Focus mode dimming
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

  const edgeStyle = isDimmed
    ? { ...style, opacity: 0.08, transition: "opacity 0.3s" }
    : { ...style, transition: "opacity 0.3s" };

  return (
    <>
      <path
        d={edgePath}
        style={edgeStyle}
        className="react-flow__edge-path"
        fill="none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Invisible wider hit area for hover */}
      <path
        d={edgePath}
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
                fontSize: 12,
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
                fontSize: 12,
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
