"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/stores/chat-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusStore } from "@/stores/focus-store";
import { apiPostWithRetry } from "@/lib/api-client";
import { soundEngine } from "@/lib/sound/sound-engine";
import { buildNodeGraphContext } from "@/lib/graph/causal-chain";

interface CanvasChatProps {
  selectedNodeId?: string | null;
}

export function CanvasChat({ selectedNodeId }: CanvasChatProps) {
  const [input, setInput] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const canSend = useChatStore((s) => s.canSend);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const originalPrompt = useCanvasStore((s) => s.originalPrompt);

  const focusedNodeId = useFocusStore((s) => s.focusedNodeId);
  const branchNodeIds = useFocusStore((s) => s.branchNodeIds);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !canSend()) return;

    setInput("");
    useChatStore.getState().addUserMessage(text);
    useChatStore.getState().setThinking(true);
    soundEngine.playChatSend();

    try {
      // Spec 17: scope to branch if focus active
      let filteredNodes = nodes;
      let filteredEdges = edges;
      if (focusedNodeId) {
        const branchSet = new Set(branchNodeIds);
        filteredNodes = nodes.filter((n) => branchSet.has(n.id));
        filteredEdges = edges.filter((e) => branchSet.has(e.source) && branchSet.has(e.target));
      }

      const currentNodes = filteredNodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        label: n.data.label,
        description: n.data.description,
      }));
      const currentEdges = filteredEdges.map((e) => ({
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      }));

      const selectedNode = selectedNodeId
        ? nodes.find((n) => n.id === selectedNodeId)
        : null;

      // Build graph-aware context for the selected/focused node
      const contextNodeId = focusedNodeId ?? selectedNodeId;
      let graphContext;
      if (contextNodeId) {
        const analysisNodes = currentNodes;
        const analysisEdges = currentEdges;
        graphContext = buildNodeGraphContext(contextNodeId, analysisNodes, analysisEdges);
      }

      const res = await apiPostWithRetry("/api/chat", {
        message: text,
        originalPrompt,
        currentNodes,
        currentEdges,
        selectedNodeId: selectedNodeId ?? undefined,
        selectedNodeLabel: selectedNode?.data.label,
        chatHistory: useChatStore.getState().getContextMessages(),
        graphContext: graphContext ?? undefined,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Chat failed");
        useChatStore.getState().setThinking(false);
        return;
      }

      const { message, operations } = data.data;

      // Apply operations to canvas
      if (operations) {
        useCanvasStore.getState().applyChatOperations(operations);
      }

      useChatStore.getState().addAssistantMessage(message, operations);
      soundEngine.playChatReceive();
    } catch {
      toast.error("Chat request failed.");
    } finally {
      useChatStore.getState().setThinking(false);
    }
  }

  const placeholder = focusedNodeId
    ? "Talk about this branch..."
    : selectedNodeId
      ? "Ask about this node..."
      : "Talk to your map...";

  const opsCount = (ops?: { addNodes: unknown[]; updateNodes: unknown[]; removeNodeIds: unknown[] }) => {
    if (!ops) return 0;
    return ops.addNodes.length + ops.updateNodes.length + ops.removeNodeIds.length;
  };

  return (
    <div className="flex flex-col">
      {/* Messages */}
      {messages.length > 0 && (
        <div
          ref={messagesRef}
          className="mb-2 max-h-[200px] overflow-y-auto space-y-2"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] rounded-md px-2.5 py-1.5 text-xs font-body"
                style={{
                  backgroundColor:
                    msg.role === "user"
                      ? "var(--accent-muted)"
                      : "var(--bg-elevated)",
                  color:
                    msg.role === "user"
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  border: `1px solid ${msg.role === "user" ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <p dir="auto">{msg.content}</p>
                {msg.operations && opsCount(msg.operations) > 0 && (
                  <span
                    className="mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-display font-semibold"
                    style={{
                      backgroundColor: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    {opsCount(msg.operations)} change{opsCount(msg.operations) !== 1 ? "s" : ""} applied
                  </span>
                )}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div
                className="rounded-md px-3 py-2"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--accent)", animationDelay: "0.2s" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--accent)", animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div
        className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--bg-elevated)",
        }}
      >
        <input
          dir="auto"
          type="text"
          className="flex-1 bg-transparent text-xs font-body text-text-primary outline-none placeholder:text-text-muted"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="shrink-0 rounded-sm p-1 text-text-muted transition-colors hover:text-accent disabled:opacity-40"
          disabled={!input.trim() || isThinking}
          onClick={handleSend}
        >
          {isThinking ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
