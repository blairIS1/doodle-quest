"use client";

let current: HTMLAudioElement | null = null;
let queue: Promise<void> = Promise.resolve();
let isSpeaking = false;
let listeners: Set<() => void> = new Set();

// Auto-unlock audio on mobile: iOS Safari / Chrome block Audio.play()
// unless triggered by user gesture. This one-time listener satisfies that.
if (typeof window !== "undefined") {
  const unlock = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {}
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("touchstart", unlock, { once: true });
  window.addEventListener("click", unlock, { once: true });
}

// Detect basePath from the current page URL.
// On GitHub Pages: location.pathname = "/ocean-rescue-quest/" → basePath = "/ocean-rescue-quest"
// On localhost:3000: location.pathname = "/" → basePath = ""
function getBasePath(): string {
  if (typeof window === "undefined") return "/audio/";
  const path = window.location.pathname;
  // Take the first path segment as basePath (matches GitHub Pages repo name)
  const match = path.match(/^\/([^/]+)/);
  // If the first segment looks like a page route (empty or _next), no basePath
  if (!match || match[1] === "_next") return "/audio/";
  return "/" + match[1] + "/audio/";
}

export function speak(key: string): Promise<void> {
  queue = queue.then(() => new Promise<void>((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }
    if (current) { current.pause(); current = null; }
    const a = new Audio(getBasePath() + key);
    current = a;
    isSpeaking = true;
    notifyListeners();
    a.onended = () => { current = null; isSpeaking = false; notifyListeners(); resolve(); };
    a.onerror = () => { current = null; isSpeaking = false; notifyListeners(); resolve(); };
    a.play().catch(() => { isSpeaking = false; notifyListeners(); resolve(); });
  }));
  return queue;
}

export function stopSpeaking(): void {
  if (current) { current.pause(); current = null; }
  isSpeaking = false;
  notifyListeners();
  queue = Promise.resolve();
}

export function getIsSpeaking(): boolean { return isSpeaking; }

export function onSpeakingChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(): void { listeners.forEach((cb) => cb()); }
