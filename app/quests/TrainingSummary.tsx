"use client";
import { useState, useEffect, useRef } from "react";
import DottieBuddy from "./DottieBuddy";
import { TrainingData, CAT_LABELS } from "./data";
import { speak, stopSpeaking } from "./speak";
import { sfxTap } from "./sfx";
import { VOICE } from "./voice";

type Props = { training: TrainingData; onComplete: () => void };

export default function TrainingSummary({ training, onComplete }: Props) {
  const [ready, setReady] = useState(false);
  const didSpeak = useRef(false);
  const cats = Object.keys(CAT_LABELS);
  const max = Math.max(1, ...cats.map((c) => training[c] || 0));
  const total = cats.reduce((s, c) => s + (training[c] || 0), 0);
  const hasBias = cats.some((c) => (training[c] || 0) > total * 0.5 && total > 2);
  const missing = cats.filter((c) => !training[c]);

  useEffect(() => {
    if (didSpeak.current) return;
    didSpeak.current = true;
    speak(VOICE.summary).then(() => {
      if (hasBias) return speak(VOICE.summaryBias);
      return speak(VOICE.summaryLearned);
    }).then(() => setReady(true));
    return () => { stopSpeaking(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center min-h-screen gap-6 p-4 fade-in">
      <DottieBuddy mood="thinking" size={100} />
      <h2 className="text-2xl font-bold">🧠 Dottie&apos;s Brain</h2>
      <p className="opacity-70 text-center">Here&apos;s what Dottie learned from your drawings!</p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {cats.map((c) => {
          const count = training[c] || 0;
          const info = CAT_LABELS[c];
          return (
            <div key={c} className="flex items-center gap-3">
              <span className="text-2xl w-10 text-center">{info.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{info.label}</span>
                  <span>{count} drawing{count !== 1 ? "s" : ""}</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--card)" }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${(count / max) * 100}%`,
                    background: count === 0 ? "#ef4444" : "var(--accent)",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasBias && (
        <div className="rounded-xl p-3 text-center text-sm" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>
          ⚠️ Most drawings are about one thing — Dottie might not know the others!
        </div>
      )}
      {missing.length > 0 && (
        <div className="rounded-xl p-3 text-center text-sm" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
          ❓ Dottie has never seen: {missing.map((c) => CAT_LABELS[c].label).join(", ")}
        </div>
      )}

      {ready && (
        <button className="btn btn-primary text-xl px-8 py-4 fade-in" onClick={() => { sfxTap(); onComplete(); }}>
          ➡️ Test Dottie!
        </button>
      )}
    </div>
  );
}
