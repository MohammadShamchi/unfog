"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { PromptPanel, PromptPanelContent } from "../panels/PromptPanel";
import { MobilePromptDrawer } from "../panels/MobilePromptDrawer";
import { ProblemCanvas } from "../canvas/ProblemCanvas";
import { ShortcutsModal } from "../ui/shortcuts-modal";
import { useSoundStore } from "@/stores/sound-store";
import { useIntakeStore } from "@/stores/intake-store";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useIsMobile } from "@/hooks/use-media-query";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function EditorLayout() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Auto-init AudioContext on first user interaction
  useEffect(() => {
    function handleInteraction() {
      useSoundStore.getState().init();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    }
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  // Auto-close mobile drawer when intake starts
  const isInIntake = useIntakeStore((s) => s.isInIntake());
  useEffect(() => {
    if (isInIntake && isMobile) setDrawerOpen(false);
  }, [isInIntake, isMobile]);

  // Sound effects hook
  useSoundEffects();

  // Keyboard shortcuts
  useKeyboardShortcuts(() => setShowShortcuts(true));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <Header
        isMobile={isMobile}
        onTogglePrompt={() => setDrawerOpen((v) => !v)}
      />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <PromptPanel />}
        <main className="relative flex-1">
          <ProblemCanvas />
        </main>
      </div>

      {isMobile && (
        <MobilePromptDrawer open={drawerOpen} onToggle={() => setDrawerOpen((v) => !v)}>
          <PromptPanelContent />
        </MobilePromptDrawer>
      )}

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
