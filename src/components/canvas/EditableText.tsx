"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface EditableTextProps {
  value: string;
  onCommit: (newValue: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}

export function EditableText({
  value,
  onCommit,
  multiline = false,
  className = "",
  placeholder = "",
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onCommit(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  }, [draft, value, onCommit]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  if (!editing) {
    return (
      <p
        className={`cursor-text ${className}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {value || placeholder}
      </p>
    );
  }

  const sharedProps = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        commit();
      }
    },
    className: `w-full bg-transparent border-0 outline-none p-0 ${className}`,
    style: {
      borderBottom: "1px solid var(--accent)",
      font: "inherit",
      fontSize: "inherit",
      fontWeight: "inherit",
      lineHeight: "inherit",
      color: "inherit",
    },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={2}
        {...sharedProps}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      {...sharedProps}
    />
  );
}
