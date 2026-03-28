import { create } from "zustand";

export type InputPhase = "invitation" | "clarification" | "reveal" | "manual" | "complete";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface InputExperienceState {
  phase: InputPhase;
  userText: string;
  conversation: ConversationMessage[];
  isAiTyping: boolean;
  currentAiMessage: string;
  typedCharIndex: number;
  fogDirection: "inward" | "outward" | "none";
  revealNodeCount: number;

  setPhase: (phase: InputPhase) => void;
  setUserText: (text: string) => void;
  addMessage: (msg: ConversationMessage) => void;
  setIsAiTyping: (v: boolean) => void;
  setCurrentAiMessage: (msg: string) => void;
  setTypedCharIndex: (i: number) => void;
  setFogDirection: (dir: "inward" | "outward" | "none") => void;
  setRevealNodeCount: (n: number) => void;
  startManualCanvas: () => void;
  reset: () => void;
}

const initialState = {
  phase: "invitation" as InputPhase,
  userText: "",
  conversation: [] as ConversationMessage[],
  isAiTyping: false,
  currentAiMessage: "",
  typedCharIndex: 0,
  fogDirection: "none" as const,
  revealNodeCount: 0,
};

export const useInputExperienceStore = create<InputExperienceState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setUserText: (userText) => set({ userText }),
  addMessage: (msg) =>
    set((s) => ({ conversation: [...s.conversation, msg] })),
  setIsAiTyping: (isAiTyping) => set({ isAiTyping }),
  setCurrentAiMessage: (currentAiMessage) => set({ currentAiMessage }),
  setTypedCharIndex: (typedCharIndex) => set({ typedCharIndex }),
  setFogDirection: (fogDirection) => set({ fogDirection }),
  setRevealNodeCount: (revealNodeCount) => set({ revealNodeCount }),
  startManualCanvas: () =>
    set({
      ...initialState,
      phase: "manual",
    }),
  reset: () => set(initialState),
}));
