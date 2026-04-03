"use client";
import { useState, useEffect } from "react";
import { getIsSpeaking, onSpeakingChange } from "./speak";

export function useSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSpeaking(getIsSpeaking());
    return onSpeakingChange(() => setSpeaking(getIsSpeaking()));
  }, []);
  return speaking;
}
