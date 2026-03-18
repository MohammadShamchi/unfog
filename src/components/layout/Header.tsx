"use client";

import { useRef } from "react";
import { Volume2, VolumeX, Download, Upload, FilePlus, MessageSquare, Cloud, CloudOff, X, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSoundStore } from "@/stores/sound-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useIntakeStore } from "@/stores/intake-store";
import { useFocusStore } from "@/stores/focus-store";
import { exportCanvas, importCanvas, downloadAsJSON } from "@/lib/export/canvas-export";
import { soundEngine } from "@/lib/sound/sound-engine";

interface HeaderProps {
  isMobile?: boolean;
  onTogglePrompt?: () => void;
  onOpenSettings?: () => void;
}

export function Header({ isMobile, onTogglePrompt, onOpenSettings }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const soundEnabled = useSoundStore((s) => s.enabled);
  const soundInit = useSoundStore((s) => s.init);
  const soundToggle = useSoundStore((s) => s.toggle);
  const nodes = useCanvasStore((s) => s.nodes);
  const isFogged = useCanvasStore((s) => s.isFogged);
  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);
  const focusedNode = nodes.find((n) => n.id === focusedNodeId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSoundToggle() {
    await soundInit();
    soundToggle();
  }

  function handleNewMap() {
    if (nodes.length > 0) {
      if (!window.confirm("Start a new map? Current work will be lost.")) return;
    }
    useCanvasStore.getState().resetCanvas();
    useIntakeStore.getState().reset();
  }

  function handleExport() {
    const state = useCanvasStore.getState();
    const data = exportCanvas(state);
    downloadAsJSON(data);
    toast.success("Canvas exported");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        const result = importCanvas(json);
        useCanvasStore.getState().importAnalysis(result);
        toast.success(`Canvas imported (${result.nodes.length} nodes)`);
      } catch {
        toast.error("Invalid file format");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <header
      className="flex items-center justify-between border-b"
      style={{
        height: "var(--header-height)",
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
        padding: isMobile ? "0 12px" : "0 20px",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        {isMobile && onTogglePrompt && (
          <button
            className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary mr-1"
            aria-label="Toggle prompt panel"
            onClick={onTogglePrompt}
          >
            <MessageSquare size={16} />
          </button>
        )}
        <span className="font-display text-lg font-bold tracking-tight text-text-primary">
          unfog
        </span>
        {!isMobile && (
          <span className="text-xs font-body text-text-muted">v0.1</span>
        )}
      </div>

      {/* Spec 17: Focus indicator pill */}
      {focusedNodeId && focusedNode && (
        <div
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-display text-xs font-semibold"
          style={{
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent)",
          }}
        >
          <span className="truncate max-w-[120px]" dir="auto">
            Focused: {focusedNode.data.label}
          </span>
          <button
            className="rounded-sm p-0.5 hover:bg-accent/20 transition-colors"
            onClick={() => useFocusStore.getState().exitFocus()}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Right controls */}
      <TooltipProvider delay={300}>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary"
              aria-label="New map"
              onClick={handleNewMap}
            >
              <FilePlus size={16} />
            </TooltipTrigger>
            <TooltipContent>New map</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary disabled:opacity-40"
              aria-label="Export JSON"
              disabled={nodes.length === 0}
              onClick={handleExport}
            >
              <Download size={16} />
            </TooltipTrigger>
            <TooltipContent>Export JSON</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary"
              aria-label="Import JSON"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
            </TooltipTrigger>
            <TooltipContent>Import JSON</TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          {nodes.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary"
                aria-label={isFogged ? "Clear fog" : "Show fog"}
                onClick={() => {
                  useCanvasStore.getState().toggleFog();
                  soundEngine.playFogToggle();
                }}
              >
                {isFogged ? <CloudOff size={16} /> : <Cloud size={16} />}
              </TooltipTrigger>
              <TooltipContent>{isFogged ? "Clear fog" : "Show fog"}</TooltipContent>
            </Tooltip>
          )}

          <div className="mx-1 h-4 w-px" style={{ backgroundColor: "var(--border)" }} />

          <Tooltip>
            <TooltipTrigger
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary"
              aria-label="Toggle sound"
              onClick={handleSoundToggle}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </TooltipTrigger>
            <TooltipContent>{soundEnabled ? "Mute sounds" : "Enable sounds"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </TooltipTrigger>
            <TooltipContent>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-text-primary"
              aria-label="AI Settings"
              onClick={onOpenSettings}
            >
              <Settings size={16} />
            </TooltipTrigger>
            <TooltipContent>AI Settings</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  );
}
