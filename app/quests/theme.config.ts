"use client";

// Each game creates its own theme.config.ts that exports this shape.
// The engine reads it for colors, voice, and music settings.

export type ThemeConfig = {
  name: string;
  colors: {
    bg: string;
    card: string;
    accent: string;
    success: string;
    warn: string;
    text: string;
  };
  voice: string;   // edge-tts voice name
  voiceRate: string; // e.g. "-5%", "+0%", "-10%"
};

// Presets — pick one or customize
export const THEMES: Record<string, ThemeConfig> = {
  space: {
    name: "Space",
    colors: { bg: "#0f172a", card: "#1e293b", accent: "#38bdf8", success: "#4ade80", warn: "#fbbf24", text: "#f1f5f9" },
    voice: "en-US-AnaNeural",
    voiceRate: "-5%",
  },
  ocean: {
    name: "Ocean",
    colors: { bg: "#0a1628", card: "#0f2942", accent: "#06b6d4", success: "#34d399", warn: "#fbbf24", text: "#e0f2fe" },
    voice: "en-US-AnaNeural",
    voiceRate: "-5%",
  },
  forest: {
    name: "Forest",
    colors: { bg: "#0f1a0f", card: "#1a2e1a", accent: "#4ade80", success: "#86efac", warn: "#fbbf24", text: "#ecfdf5" },
    voice: "en-US-AnaNeural",
    voiceRate: "-5%",
  },
  sunset: {
    name: "Sunset",
    colors: { bg: "#1a0a0a", card: "#2d1515", accent: "#fb923c", success: "#4ade80", warn: "#fbbf24", text: "#fff7ed" },
    voice: "en-US-AnaNeural",
    voiceRate: "-5%",
  },
  candy: {
    name: "Candy",
    colors: { bg: "#1a0f1e", card: "#2d1a35", accent: "#e879f9", success: "#4ade80", warn: "#fbbf24", text: "#fdf4ff" },
    voice: "en-US-AnaNeural",
    voiceRate: "-5%",
  },
};

// Available edge-tts voices for kids games
export const VOICES = {
  // English — Kid-friendly
  "en-US-AnaNeural": "Ana (US, child, cartoon)",
  "en-US-JennyNeural": "Jenny (US, adult female, warm)",
  "en-US-GuyNeural": "Guy (US, adult male, friendly)",
  "en-GB-MaisieNeural": "Maisie (UK, child)",
  "en-AU-AnnetteNeural": "Annette (AU, adult female)",
  // Chinese
  "zh-CN-XiaoxiaoNeural": "Xiaoxiao (CN, female, warm)",
  "zh-CN-XiaoyiNeural": "Xiaoyi (CN, female, child-like)",
  "zh-CN-YunxiNeural": "Yunxi (CN, male, friendly)",
  // Multilingual
  "en-US-AvaMultilingualNeural": "Ava (US, multilingual)",
} as const;
