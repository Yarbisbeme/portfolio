"use client";

import { useSyncExternalStore } from "react";

/**
 * Sonido del portfolio: apagado por defecto, solo responde a algo que el visitante hace
 * y nunca suena solo. El AudioContext ni siquiera se crea hasta el primer sonido pedido.
 *
 * Muestras: grabaciones propias de piano en /audio/piano/<midi>.mp3. Cada nota pedida usa la
 * muestra más cercana con un ajuste de afinación. Si no hay muestras, suena un piano sintético.
 */
export const SAMPLE_NOTES: number[] = []; // p. ej. [43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77]

const KEY = "sonido";
const listeners = new Set<() => void>();
let enabled = false;
let loaded = false;

function read() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      enabled = window.localStorage.getItem(KEY) === "si";
    } catch {
      enabled = false;
    }
  }
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, on ? "si" : "no");
  } catch {
    /* sin almacenamiento: vale solo para esta visita */
  }
  listeners.forEach((l) => l());
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => false,
  );
}

export const soundEnabled = () => read();

// ── Motor ──────────────────────────────────────────────────────────────────
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<number, Promise<AudioBuffer | null>>();

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: master! };
}

function sample(midi: number) {
  if (!buffers.has(midi)) {
    const { ctx } = audio();
    buffers.set(
      midi,
      fetch(`/audio/piano/${midi}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null),
    );
  }
  return buffers.get(midi)!;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Piano provisional: dos parciales suaves con ataque corto y caída larga. */
function synth(midi: number, at: number, dur: number, vel: number) {
  const { ctx, out } = audio();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800 + midi * 12;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.32 * vel, at + 0.006);
  g.gain.exponentialRampToValueAtTime(0.12 * vel, at + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  lp.connect(g).connect(out);
  for (const [mult, type, level] of [
    [1, "triangle", 1],
    [2, "sine", 0.18],
  ] as const) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = type;
    o.frequency.value = hz(midi) * mult;
    og.gain.value = level;
    o.connect(og).connect(lp);
    o.start(at);
    o.stop(at + dur + 0.05);
  }
}

/** Toca una nota (MIDI). `delay` en segundos desde ahora. */
export function playNote(midi: number, { delay = 0, dur = 1.6, vel = 0.8 } = {}) {
  const { ctx, out } = audio();
  const at = ctx.currentTime + 0.01 + delay;
  if (SAMPLE_NOTES.length === 0) return synth(midi, at, dur, vel);
  const near = SAMPLE_NOTES.reduce((a, b) => (Math.abs(b - midi) < Math.abs(a - midi) ? b : a));
  void sample(near).then((buf) => {
    if (!buf) return synth(midi, at, dur, vel);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (midi - near) / 12);
    g.gain.setValueAtTime(vel, at);
    g.gain.setTargetAtTime(0, at + dur, 0.15);
    src.connect(g).connect(out);
    src.start(Math.max(at, ctx.currentTime));
  });
}

export function playChord(notes: number[], opts: { delay?: number; dur?: number; vel?: number } = {}) {
  notes.forEach((n, i) => playNote(n, { ...opts, delay: (opts.delay ?? 0) + i * 0.018, vel: (opts.vel ?? 0.7) * 0.8 }));
}

// ── Teoría mínima ─────────────────────────────────────────────────────────
const DIATONIC = [0, 2, 4, 5, 7, 9, 11]; // escala de do mayor

/** Sube `steps` grados diatónicos desde una nota natural de do mayor. */
export function diatonic(fromMidi: number, steps: number) {
  const octave = Math.floor(fromMidi / 12);
  let degree = DIATONIC.indexOf(fromMidi % 12) + steps;
  const o = octave + Math.floor(degree / 7);
  degree = ((degree % 7) + 7) % 7;
  return o * 12 + DIATONIC[degree];
}

/**
 * Altura de una nota del gran pentagrama según dónde está dibujada.
 * `y` = medios espacios desde la línea superior (0 = línea de arriba, 8 = línea de abajo).
 * Build lee en clave de sol (línea superior = fa5); Verify en clave de fa (línea superior = la3).
 */
export function staffPitch(staff: "build" | "verify", y: number) {
  return staff === "build" ? diatonic(77, -y) : diatonic(57, -y);
}

/** El acorde de cada forma de leer el portfolio: las voces que suenan. */
export const MODE_CHORD: Record<string, number[]> = {
  general: [48, 55, 64, 72], // ambas voces
  backend: [72, 76, 79], // solo la voz de arriba
  qa: [48, 52, 55], // solo la de abajo
};
