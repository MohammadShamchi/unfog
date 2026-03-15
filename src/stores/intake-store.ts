import { create } from "zustand";
import type {
  IntakeState,
  IntakeQuestion,
  IntakeAnswer,
} from "@/types/analysis";

interface IntakeStore extends IntakeState {
  // Actions
  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
  startAssessment: () => void;
  setQuestions: (questions: IntakeQuestion[]) => void;
  submitAnswers: (answers: IntakeAnswer[]) => void;
  setGenerating: () => void;
  setEnrichedPrompt: (prompt: string) => void;
  reset: () => void;

  // Computed
  getAllAnswers: () => IntakeAnswer[];
  isInIntake: () => boolean;
}

const initialState: IntakeState = {
  status: "idle",
  rounds: [],
  enrichedPrompt: null,
};

export const useIntakeStore = create<IntakeStore>((set, get) => ({
  ...initialState,

  activePrompt: "",
  setActivePrompt: (prompt) => set({ activePrompt: prompt }),

  startAssessment: () => set({ status: "assessing" }),

  setQuestions: (questions) =>
    set({
      status: "asking",
      rounds: [
        ...get().rounds,
        { questions, answers: [] },
      ],
    }),

  submitAnswers: (answers) => {
    const rounds = [...get().rounds];
    const currentRound = rounds[rounds.length - 1];
    if (currentRound) {
      currentRound.answers = answers;
    }
    set({ status: "answering", rounds });
  },

  setGenerating: () => set({ status: "generating" }),

  setEnrichedPrompt: (prompt) => set({ enrichedPrompt: prompt }),

  reset: () => set({ ...initialState, activePrompt: "" }),

  getAllAnswers: () =>
    get().rounds.flatMap((r) => r.answers),

  isInIntake: () => {
    const s = get().status;
    return s === "assessing" || s === "asking" || s === "answering";
  },
}));