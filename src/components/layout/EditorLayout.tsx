"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./Header";
import { PromptPanel, PromptPanelContent } from "../panels/PromptPanel";
import { MobilePromptDrawer } from "../panels/MobilePromptDrawer";
import { ProblemCanvas } from "../canvas/ProblemCanvas";
import { ShortcutsModal } from "../ui/shortcuts-modal";
import { SettingsModal } from "../ui/settings-modal";
import { useSoundStore } from "@/stores/sound-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useIntakeStore } from "@/stores/intake-store";
import { useInputExperienceStore } from "@/stores/input-experience-store";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useIsMobile } from "@/hooks/use-media-query";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function EditorLayout() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    if (!isInIntake || !isMobile) return;

    const frame = window.requestAnimationFrame(() => {
      setDrawerOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isInIntake, isMobile]);

  // Sound effects hook
  useSoundEffects();

  // Keyboard shortcuts
  useKeyboardShortcuts(() => setShowShortcuts(true), () => setShowSettings(true));

  const nodes = useCanvasStore((s) => s.nodes);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const inputPhase = useInputExperienceStore((s) => s.phase);
  const isInputActive = inputPhase === "invitation" || inputPhase === "clarification";
  const hasActiveMap = (nodes.length > 0 || isLoading) && !isInputActive;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <AnimatePresence>
        {!isInputActive && (
          <motion.div
            key="header"
            initial={{ y: -52, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -52, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Header
              isMobile={isMobile}
              onTogglePrompt={() => setDrawerOpen((v) => !v)}
              onOpenSettings={() => setShowSettings(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>
          {!isMobile && hasActiveMap && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden flex-shrink-0"
            >
              <PromptPanel />
            </motion.div>
          )}
        </AnimatePresence>
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
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
