import * as Tone from "tone";

let initialized = false;
let enabled = true;

function isReady() {
  return initialized && enabled;
}

export const soundEngine = {
  async init() {
    if (initialized) return;
    await Tone.start();
    Tone.getDestination().volume.value = -20;
    initialized = true;
  },

  setEnabled(v: boolean) {
    enabled = v;
  },

  playNodeCreate() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.01 },
    }).toDestination();
    synth.triggerAttackRelease("C4", "120ms");
    setTimeout(() => {
      synth.triggerAttackRelease("E4", "60ms");
    }, 40);
    setTimeout(() => synth.dispose(), 300);
  },

  playNodeDelete() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.01 },
    }).toDestination();
    synth.triggerAttackRelease("E4", "60ms");
    setTimeout(() => {
      synth.triggerAttackRelease("C4", "120ms");
    }, 40);
    setTimeout(() => synth.dispose(), 300);
  },

  playTypeChange() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.01 },
    }).toDestination();
    synth.triggerAttackRelease("C5", "80ms");
    setTimeout(() => synth.dispose(), 200);
  },

  playEdgeConnect() {
    if (!isReady()) return;
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.01 },
    }).toDestination();
    synth.triggerAttackRelease(["C4", "E4"], "100ms");
    setTimeout(() => synth.dispose(), 300);
  },

  playAiStart() {
    if (!isReady()) return;
    const filter = new Tone.Filter(200, "lowpass").toDestination();
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.4, decay: 0, sustain: 1, release: 0.05 },
    }).connect(filter);
    filter.frequency.rampTo(2000, 0.4);
    synth.triggerAttackRelease("C3", "400ms");
    setTimeout(() => {
      synth.dispose();
      filter.dispose();
    }, 600);
  },

  playAiComplete() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.02 },
    }).toDestination();
    synth.triggerAttackRelease("C4", "50ms");
    setTimeout(() => synth.triggerAttackRelease("E4", "50ms"), 50);
    setTimeout(() => synth.triggerAttackRelease("G4", "50ms"), 100);
    setTimeout(() => synth.dispose(), 300);
  },

  playFogToggle() {
    if (!isReady()) return;
    const filter = new Tone.Filter(800, "lowpass").toDestination();
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0, release: 0.04 },
    }).connect(filter);
    filter.frequency.rampTo(2000, 0.15);
    synth.triggerAttackRelease("A3", "150ms");
    setTimeout(() => {
      synth.dispose();
      filter.dispose();
    }, 300);
  },

  playUndo() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.01 },
      volume: -6,
    }).toDestination();
    synth.triggerAttackRelease("C4", "50ms");
    setTimeout(() => synth.triggerAttackRelease("E4", "50ms"), 30);
    setTimeout(() => synth.dispose(), 200);
  },

  // Spec 14: Explore arpeggio
  playExplore() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.06, sustain: 0, release: 0.02 },
    }).toDestination();
    synth.triggerAttackRelease("C4", "40ms");
    setTimeout(() => synth.triggerAttackRelease("E4", "40ms"), 40);
    setTimeout(() => synth.triggerAttackRelease("G4", "40ms"), 80);
    setTimeout(() => synth.dispose(), 250);
  },

  // Spec 15: Chat send blip
  playChatSend() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.06, sustain: 0, release: 0.01 },
      volume: -8,
    }).toDestination();
    synth.triggerAttackRelease("G4", "40ms");
    setTimeout(() => synth.dispose(), 150);
  },

  // Spec 15: Chat receive
  playChatReceive() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 },
      volume: -6,
    }).toDestination();
    synth.triggerAttackRelease("E4", "60ms");
    setTimeout(() => synth.triggerAttackRelease("G4", "60ms"), 50);
    setTimeout(() => synth.dispose(), 200);
  },

  // Options ready: gentle two-note chord (branching paths)
  playOptionsReady() {
    if (!isReady()) return;
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 },
      volume: -8,
    }).toDestination();
    synth.triggerAttackRelease(["C4", "G4"], "100ms");
    setTimeout(() => synth.dispose(), 250);
  },

  // Spec 16: Ghost dismiss
  playGhostDismiss() {
    if (!isReady()) return;
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 },
      volume: -12,
    }).toDestination();
    synth.triggerAttackRelease("E4", "80ms");
    setTimeout(() => synth.triggerAttackRelease("C4", "80ms"), 60);
    setTimeout(() => synth.dispose(), 250);
  },
};
