"use client";

let ctx: AudioContext | null = null;
let playing = false;

export type MusicStyle = "pentatonic" | "ocean" | "adventure" | "lullaby" | "space";

let currentStyle: MusicStyle = "pentatonic";

export function startMusic(style?: MusicStyle) {
  if (style) currentStyle = style;
  if (playing || typeof window === "undefined") return;
  ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  playing = true;
  loop();
}

export function stopMusic() {
  playing = false;
  if (ctx) { ctx.close(); ctx = null; }
}

function playNote(freq: number, start: number, dur: number, vol: number, type: OscillatorType = "sine") {
  if (!ctx || !playing) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.1);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur);
}

const STYLES: Record<MusicStyle, { notes: number[]; gap: number; vol: number; dur: number; type: OscillatorType }> = {
  pentatonic: { notes: [262, 294, 330, 392, 440, 392, 330, 294], gap: 0.8, vol: 0.03, dur: 0.7, type: "sine" },
  ocean:     { notes: [220, 262, 330, 262, 220, 196, 220, 262], gap: 1.0, vol: 0.025, dur: 0.9, type: "sine" },
  adventure: { notes: [330, 392, 440, 523, 440, 392, 330, 392], gap: 0.6, vol: 0.03, dur: 0.5, type: "triangle" },
  lullaby:   { notes: [262, 330, 392, 330, 262, 220, 196, 220], gap: 1.2, vol: 0.02, dur: 1.0, type: "sine" },
  space:     { notes: [196, 220, 262, 330, 392, 330, 262, 220], gap: 1.0, vol: 0.025, dur: 0.8, type: "sine" },
};

function loop() {
  if (!playing || !ctx) return;
  const s = STYLES[currentStyle];
  s.notes.forEach((n, i) => playNote(n, i * s.gap, s.dur, s.vol, s.type));
  setTimeout(loop, s.notes.length * s.gap * 1000);
}
