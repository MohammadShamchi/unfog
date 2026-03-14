"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function PromptPanel() {
  return (
    <aside
      className="flex flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {/* Input section */}
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-sm font-semibold text-text-primary mb-1">
            Describe your problem
          </h2>
          <p className="text-xs text-text-muted font-body">
            Write anything — in any language. AI will map it.
          </p>
        </div>

        <Textarea
          placeholder="I run a software company. Sales are bad, HR is a mess, and we're not shipping fast enough..."
          className="min-h-[140px] resize-none border-border bg-elevated text-text-primary placeholder:text-text-muted font-body text-sm focus:border-accent focus:ring-1 focus:ring-accent-glow"
          style={{
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-elevated)",
          }}
          disabled
        />

        <Button
          className="w-full gap-2 font-display text-sm font-semibold"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--bg-canvas)",
            borderRadius: "var(--radius-sm)",
          }}
          disabled
        >
          <Sparkles size={16} />
          Unfog this
        </Button>
      </div>

      {/* Divider */}
      <div
        className="mx-5"
        style={{ borderTop: "1px solid var(--border)" }}
      />

      {/* History section — placeholder */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          History
        </h3>
        <p className="text-xs text-text-muted font-body">
          Previous prompts will appear here.
        </p>
      </div>
    </aside>
  );
}
