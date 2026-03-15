import { create } from "zustand";
import type { ChatMessage, ChatOperations } from "@/types/analysis";

interface ChatState {
  messages: ChatMessage[];
  isThinking: boolean;
  lastSentAt: number;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, operations?: ChatOperations) => void;
  setThinking: (v: boolean) => void;
  clearChat: () => void;
  canSend: () => boolean;
  getContextMessages: () => Array<{ role: "user" | "assistant"; content: string }>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isThinking: false,
  lastSentAt: 0,

  addUserMessage: (content) => {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    set((s) => ({
      messages: [...s.messages, msg],
      lastSentAt: Date.now(),
    }));
  },

  addAssistantMessage: (content, operations) => {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_ai`,
      role: "assistant",
      content,
      operations,
      timestamp: Date.now(),
    };
    set((s) => ({
      messages: [...s.messages, msg],
    }));
  },

  setThinking: (v) => set({ isThinking: v }),

  clearChat: () => set({ messages: [], isThinking: false, lastSentAt: 0 }),

  canSend: () => {
    const { lastSentAt, isThinking } = get();
    if (isThinking) return false;
    return Date.now() - lastSentAt >= 3000;
  },

  getContextMessages: () => {
    const { messages } = get();
    const RECENT_COUNT = 8;

    if (messages.length <= RECENT_COUNT) {
      return messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }

    // Older messages: keep user messages condensed as decision context
    const older = messages.slice(0, -RECENT_COUNT);
    const olderSummary = older
      .filter((m) => m.role === "user")
      .map((m) => m.content.slice(0, 150))
      .join(" | ");

    const recent = messages.slice(-RECENT_COUNT).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Prepend a synthetic context message so the AI knows what was discussed earlier
    return [
      {
        role: "user" as const,
        content: `[Earlier in this conversation, the user discussed: ${olderSummary}]`,
      },
      ...recent,
    ];
  },
}));
