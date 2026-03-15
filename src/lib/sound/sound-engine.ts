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
};
