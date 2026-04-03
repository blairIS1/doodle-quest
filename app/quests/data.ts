"use client";

export const CATEGORIES = ["animal", "nature", "thing"] as const;
export type Category = typeof CATEGORIES[number];
export type TrainingData = Record<string, number>;

export function getConfidence(training: TrainingData, cat: string): number {
  const count = training[cat] || 0;
  return count === 0 ? 20 : count === 1 ? 55 : 90;
}

export const CAT_LABELS: Record<string, { emoji: string; label: string }> = {
  animal: { emoji: "🐱", label: "Animals" },
  nature: { emoji: "🌻", label: "Nature" },
  thing:  { emoji: "🏠", label: "Things" },
};

export type DrawPrompt = {
  id: string;
  emoji: string;
  label: string;
  category: Category;
  voiceKey: string;
  hint: string; // simple description for the hint overlay
};

export const DRAW_PROMPTS: DrawPrompt[] = [
  { id: "cat",    emoji: "🐱", label: "Cat",    category: "animal", voiceKey: "drawCat",    hint: "Round head, pointy ears, whiskers" },
  { id: "fish",   emoji: "🐟", label: "Fish",   category: "animal", voiceKey: "drawFish",   hint: "Oval body, tail fin, eye" },
  { id: "sun",    emoji: "☀️", label: "Sun",    category: "nature", voiceKey: "drawSun",    hint: "Circle with lines around it" },
  { id: "flower", emoji: "🌻", label: "Flower", category: "nature", voiceKey: "drawFlower", hint: "Circle center, petals around it" },
  { id: "house",  emoji: "🏠", label: "House",  category: "thing",  voiceKey: "drawHouse",  hint: "Square with triangle roof" },
  { id: "star",   emoji: "⭐", label: "Star",   category: "thing",  voiceKey: "drawStar",   hint: "Five points going out" },
];

// --- Stroke-based heuristic classifier ---

export type Point = { x: number; y: number };
export type Stroke = { points: Point[]; color: string };

type Features = {
  strokeCount: number;
  aspectRatio: number;
  hasClosedLoop: boolean;
  isRadial: boolean;
  density: number; // points per bounding-box area
};

function extractFeatures(strokes: Stroke[]): Features {
  const all = strokes.flatMap((s) => s.points);
  if (all.length < 2) return { strokeCount: 0, aspectRatio: 1, hasClosedLoop: false, isRadial: false, density: 0 };

  const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX || 1, h = maxY - minY || 1;

  const hasClosedLoop = strokes.some((s) => {
    if (s.points.length < 8) return false;
    const f = s.points[0], l = s.points[s.points.length - 1];
    return Math.hypot(f.x - l.x, f.y - l.y) < w * 0.2;
  });

  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const radialStrokes = strokes.filter((s) => {
    if (s.points.length < 3) return false;
    const start = s.points[0];
    const distStart = Math.hypot(start.x - cx, start.y - cy);
    const end = s.points[s.points.length - 1];
    const distEnd = Math.hypot(end.x - cx, end.y - cy);
    return distEnd > distStart * 1.3;
  });

  return {
    strokeCount: strokes.length,
    aspectRatio: w / h,
    hasClosedLoop,
    isRadial: radialStrokes.length >= 3,
    density: all.length / (w * h) * 10000,
  };
}

// Per-prompt feature expectations (loose — toddler drawings are wild)
const PROMPT_FEATURES: Record<string, (f: Features) => number> = {
  cat:    (f) => (f.hasClosedLoop ? 30 : 0) + (f.strokeCount >= 3 ? 20 : 0) + (f.aspectRatio < 1.5 ? 10 : 0),
  fish:   (f) => (f.aspectRatio > 1.2 ? 30 : 0) + (f.strokeCount >= 2 ? 20 : 0) + (!f.isRadial ? 10 : 0),
  sun:    (f) => (f.isRadial ? 40 : 0) + (f.hasClosedLoop ? 20 : 0),
  flower: (f) => (f.isRadial ? 30 : 0) + (f.hasClosedLoop ? 20 : 0) + (f.strokeCount >= 3 ? 10 : 0),
  house:  (f) => (f.strokeCount >= 3 ? 20 : 0) + (f.aspectRatio < 1.3 ? 20 : 0) + (!f.isRadial ? 10 : 0),
  star:   (f) => (f.isRadial ? 30 : 0) + (f.strokeCount >= 2 ? 10 : 0) + (!f.hasClosedLoop ? 10 : 0),
};

export type Guess = { id: string; label: string; emoji: string; confidence: number };

export function classify(strokes: Stroke[], training: TrainingData): Guess[] {
  const features = extractFeatures(strokes);
  return DRAW_PROMPTS.map((p) => {
    const featureScore = (PROMPT_FEATURES[p.id]?.(features) || 0) / 60; // 0-1
    const dataBoost = getConfidence(training, p.category) / 100; // 0-1
    const confidence = Math.min(95, Math.round((featureScore * 0.4 + dataBoost * 0.6) * 100));
    return { id: p.id, label: p.label, emoji: p.emoji, confidence };
  }).sort((a, b) => b.confidence - a.confidence);
}
