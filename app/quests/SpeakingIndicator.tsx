"use client";
import { useState, useEffect } from "react";
import { getIsSpeaking, onSpeakingChange, stopSpeaking } from "./speak";

export function useSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSpeaking(getIsSpeaking());
    return onSpeakingChange(() => setSpeaking(getIsSpeaking()));
  }, []);
  return speaking;
}

export default function SpeakingIndicator() {
  const speaking = useSpeaking();
  if (!speaking) return null;

  return (
    <div className="fixed top-4 right-4 flex items-center gap-3 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-full z-50 shadow-lg">
      <div className="flex gap-1">
        <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
        <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-white text-sm">🔊 Speaking...</span>
      <button
        className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-semibold transition-colors"
        onClick={stopSpeaking}
      >
        Skip ⏭️
      </button>
    </div>
  );
}
