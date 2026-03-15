"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import type { AIConfig } from "@/types/analysis";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type Provider = AIConfig["provider"];

const PROVIDERS: { id: Provider; label: string; placeholder: string }[] = [
  { id: "gemini", label: "Gemini", placeholder: "AIza..." },
  { id: "openai", label: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", label: "Claude", placeholder: "sk-ant-..." },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-..." },
];

interface ModelInfo {
  id: string;
  name: string;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const provider = useSettingsStore((s) => s.provider);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const model = useSettingsStore((s) => s.model);
  const temperature = useSettingsStore((s) => s.temperature);
  const setProvider = useSettingsStore((s) => s.setProvider);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setModel = useSettingsStore((s) => s.setModel);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const isConfigured = useSettingsStore((s) => s.isConfigured);

  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Fetch models when API key changes (debounced)
  const fetchModels = useCallback(async (p: Provider, key: string) => {
    setModelsLoading(true);
    setModelsError("");
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: p, apiKey: key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModelsError(data.error || "Failed to fetch models");
        setModels([]);
      } else {
        setModels(data.models || []);
      }
    } catch {
      setModelsError("Network error");
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // OpenRouter doesn't need API key for model listing
    if (provider === "openrouter") {
      fetchModels("openrouter", "");
      return;
    }
    if (!apiKey || apiKey.length < 5) {
      setModels([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchModels(provider, apiKey);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [provider, apiKey, open, fetchModels]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const filteredModels = models.filter((m) => {
    const q = modelSearch.toLowerCase();
    return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [modelSearch]);

  function handleModelKeyDown(e: React.KeyboardEvent) {
    if (!dropdownOpen && e.key === "ArrowDown") {
      setDropdownOpen(true);
      return;
    }
    if (!dropdownOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filteredModels.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredModels[highlightIndex];
      if (selected) {
        setModel(selected.id);
        setModelSearch("");
        setDropdownOpen(false);
      }
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setDropdownOpen(false);
    }
  }

  const providerConfig = PROVIDERS.find((p) => p.id === provider)!;
  const configured = isConfigured();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[calc(100vw-32px)] rounded-md border p-5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.15 }}
          >
            {/* Title */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-sm font-semibold text-text-primary">
                AI Settings
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-sm px-2 py-0.5 text-[10px] font-display font-semibold"
                  style={{
                    backgroundColor: configured ? "rgba(95, 224, 193, 0.1)" : "var(--bg-elevated)",
                    color: configured ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {configured ? "Connected" : "Add API key"}
                </span>
                <button
                  className="rounded-sm p-1 text-text-muted hover:text-text-primary transition-colors"
                  onClick={onClose}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Provider pills */}
            <div className="flex gap-1 mb-4">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className="flex-1 rounded-sm px-2 py-1.5 text-xs font-display font-semibold transition-colors"
                  style={{
                    backgroundColor: provider === p.id ? "var(--accent-muted)" : "var(--bg-elevated)",
                    color: provider === p.id ? "var(--accent)" : "var(--text-secondary)",
                    border: `1px solid ${provider === p.id ? "var(--accent)" : "var(--border)"}`,
                  }}
                  onClick={() => setProvider(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* API key */}
            <div className="mb-4">
              <label className="block text-xs font-body text-text-muted mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  className="w-full rounded-sm border px-3 py-2 pr-9 text-xs font-mono bg-transparent text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                  placeholder={providerConfig.placeholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Model selector */}
            <div className="mb-4" ref={dropdownRef}>
              <label className="block text-xs font-body text-text-muted mb-1.5">
                Model
              </label>
              <div className="relative">
                <div
                  className="flex items-center rounded-sm border px-3 py-2 cursor-pointer"
                  style={{
                    borderColor: dropdownOpen ? "var(--accent)" : "var(--border)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                >
                  {dropdownOpen ? (
                    <input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-xs font-body text-text-primary outline-none placeholder:text-text-muted"
                      placeholder="Search models..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      onKeyDown={handleModelKeyDown}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 text-xs font-body truncate" style={{ color: model ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {model || "Select a model..."}
                    </span>
                  )}
                  {modelsLoading ? (
                    <Loader2 size={14} className="animate-spin text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-text-muted shrink-0" />
                  )}
                </div>

                {/* Dropdown list */}
                <AnimatePresence>
                  {dropdownOpen && !modelsLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-0 right-0 top-full mt-1 z-10 rounded-sm border overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="max-h-[200px] overflow-y-auto">
                        {modelsError ? (
                          <div className="px-3 py-2 text-xs font-body text-red-400">
                            {modelsError}
                          </div>
                        ) : filteredModels.length === 0 ? (
                          <div className="px-3 py-2 text-xs font-body text-text-muted">
                            {models.length === 0 ? "Enter an API key to load models" : "No matching models"}
                          </div>
                        ) : (
                          filteredModels.map((m, i) => (
                            <button
                              key={m.id}
                              className="w-full text-left px-3 py-1.5 text-xs font-body transition-colors"
                              style={{
                                backgroundColor: i === highlightIndex ? "var(--bg-elevated)" : "transparent",
                                color: m.id === model ? "var(--accent)" : "var(--text-secondary)",
                              }}
                              onMouseEnter={() => setHighlightIndex(i)}
                              onClick={() => {
                                setModel(m.id);
                                setModelSearch("");
                                setDropdownOpen(false);
                              }}
                            >
                              <span className="block truncate">{m.name}</span>
                              {m.name !== m.id && (
                                <span className="block text-[10px] text-text-muted truncate">{m.id}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="flex items-center justify-between text-xs font-body text-text-muted mb-1.5">
                <span>Temperature</span>
                <span className="font-mono text-text-secondary">{temperature.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
