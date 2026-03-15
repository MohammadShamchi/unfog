"use client";

import { useRef } from "react";
import { Volume2, VolumeX, Download, Upload, FilePlus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSoundStore } from "@/stores/sound-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useIntakeStore } from "@/stores/intake-store";
import { exportCanvas, importCanvas, downloadAsJSON } from "@/lib/export/canvas-export";

interface HeaderProps {
  isMobile?: boolean;
  onTogglePrompt?: () => void;
}

export function Header({ isMobile, onTogglePrompt }: HeaderProps) {
  const soundEnabled = useSoundStore((s) => s.enabled);
  const soundInit = useSoundStore((s) => s.init);
  const soundToggle = useSoundStore((s) => s.toggle);
  const nodes = useCanvasStore((s) => s.nodes);
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
        </div>
      </TooltipProvider>
    </header>
  );
}
