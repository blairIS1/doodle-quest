"use client";

const KEY = "quest-completions";

export function recordCompletion(): number {
  const n = getCompletions() + 1;
  if (typeof window !== "undefined") localStorage.setItem(KEY, String(n));
  return n;
}

export function getCompletions(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) || "0", 10);
}
