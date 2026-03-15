"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Double-click", action: "Edit node text" },
  { key: "Backspace / Delete", action: "Delete selected" },
  { key: "⌘ Z", action: "Undo" },
  { key: "⌘ ⇧ Z", action: "Redo" },
  { key: "?", action: "Show shortcuts" },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[320px] rounded-md border p-5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-semibold text-text-primary">
                Keyboard shortcuts
              </h2>
              <button
                className="rounded-sm p-1 text-text-muted hover:text-text-primary transition-colors"
                onClick={onClose}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="font-body text-xs text-text-secondary">
                    {s.action}
                  </span>
                  <kbd
                    className="rounded px-2 py-0.5 font-mono text-[11px] text-text-primary"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
