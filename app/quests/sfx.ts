"use client";

const ctx = () => new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

function play(freq: number, type: OscillatorType, dur: number, vol = 0.3) {
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

export function sfxCorrect() {
  play(523, "sine", 0.15); setTimeout(() => play(659, "sine", 0.15), 100); setTimeout(() => play(784, "sine", 0.3), 200);
}
export function sfxWrong() {
  play(350, "sine", 0.15, 0.15); setTimeout(() => play(280, "sine", 0.2, 0.12), 150);
}
export function sfxTap() { play(880, "sine", 0.08, 0.15); }
export function sfxCelebrate() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => play(f, "sine", 0.2, 0.2), i * 120));
}
