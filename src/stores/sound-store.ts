import { create } from "zustand";
import { soundEngine } from "@/lib/sound/sound-engine";

interface SoundState {
  enabled: boolean;
  initialized: boolean;
  toggle: () => void;
  init: () => Promise<void>;
}

function readPersisted(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("unfog:sound");
  return stored === null ? true : stored === "true";
}

export const useSoundStore = create<SoundState>((set, get) => ({
  enabled: readPersisted(),
  initialized: false,

  toggle: () => {
    const next = !get().enabled;
    set({ enabled: next });
    soundEngine.setEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("unfog:sound", String(next));
    }
  },

  init: async () => {
    if (get().initialized) return;
    await soundEngine.init();
    soundEngine.setEnabled(get().enabled);
    set({ initialized: true });
  },
}));
