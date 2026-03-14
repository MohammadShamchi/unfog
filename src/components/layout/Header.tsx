"use client";

import { Volume2 } from "lucide-react";

export function Header() {
  return (
    <header
      className="flex items-center justify-between border-b px-5"
      style={{
        height: "var(--header-height)",
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="font-display text-lg font-bold tracking-tight text-text-primary">
          unfog
        </span>
        <span className="text-xs font-body text-text-muted">v0.1</span>
      </div>

      {/* Right controls — placeholders */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-sm p-1.5 text-text-secondary transition-colors duration-micro hover:bg-surface-hover hover:text-text-primary"
          aria-label="Toggle sound"
        >
          <Volume2 size={18} />
        </button>
      </div>
    </header>
  );
}
