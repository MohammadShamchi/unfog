"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

interface MobilePromptDrawerProps {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function MobilePromptDrawer({ open, onToggle, children }: MobilePromptDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-40 flex flex-col border-t"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
          maxHeight: "70vh",
        }}
        initial={{ y: "calc(100% - 48px)" }}
        animate={{ y: open ? 0 : "calc(100% - 48px)" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Handle */}
        <button
          className="flex h-12 shrink-0 items-center justify-center gap-2 border-b"
          style={{ borderColor: "var(--border)" }}
          onClick={onToggle}
        >
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: "var(--border-hover)" }}
          />
          <span className="font-display text-xs font-semibold text-text-secondary ml-2">
            Prompt
          </span>
          {open ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronUp size={14} className="text-text-muted" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </>
  );
}
