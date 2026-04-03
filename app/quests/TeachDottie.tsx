"use client";
import { useState, useEffect, useRef } from "react";
import Canvas from "./Canvas";
import DottieBuddy from "./DottieBuddy";
import Confetti from "./Confetti";
import { DRAW_PROMPTS, TrainingData, Stroke } from "./data";
import { sfxTap, sfxCorrect, sfxCelebrate } from "./sfx";
import { speak, stopSpeaking } from "./speak";
import { VOICE } from "./voice";

type Props = { onComplete: (training: TrainingData) => void };

export default function TeachDottie({ onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"draw" | "thinking" | "learned" | "done">("draw");
  const [training, setTraining] = useState<TrainingData>({});
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const didSpeak = useRef(false);
  const trainingRef = useRef(training);
  trainingRef.current = training;

  const prompt = DRAW_PROMPTS[idx];

  // Speak prompt on mount and when idx changes
  useEffect(() => {
    if (didSpeak.current && idx === 0) return; // skip StrictMode double-fire
    didSpeak.current = true;
    stopSpeaking();
    speak(VOICE[prompt.voiceKey]);
    return () => { stopSpeaking(); };
  }, [idx, prompt.voiceKey]);

  const handleDone = () => {
    if (strokes.length === 0) return;
    sfxTap();
    setPhase("thinking");
    stopSpeaking();
    speak(VOICE.thinking).then(() => {
      setTimeout(() => {
        sfxCorrect();
        setShowConfetti(true);
        setPhase("learned");
        setTraining((prev) => {
          const next = { ...prev, [prompt.category]: (prev[prompt.category] || 0) + 1 };
          trainingRef.current = next;
          return next;
        });
        speak(VOICE.trainGotIt);
      }, 1500);
    });
  };

  const handleNext = () => {
    sfxTap();
    setShowConfetti(false);
    setStrokes([]);
    setCanvasKey((k) => k + 1);
    if (idx + 1 >= DRAW_PROMPTS.length) {
      setPhase("done");
      sfxCelebrate();
      speak(VOICE.q1Done).then(() => speak(VOICE.q1Learned)).then(() => onComplete(trainingRef.current));
    } else {
      setPhase("draw");
      setIdx(idx + 1);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen gap-4 p-4 fade-in">
      <Confetti active={showConfetti} />
      <div className="flex items-center gap-3">
        <DottieBuddy mood={phase === "thinking" ? "thinking" : phase === "learned" ? "happy" : "idle"} size={80} />
        <div>
          <h2 className="text-xl font-bold">🖍️ Teach Dottie to See</h2>
          <p className="text-sm opacity-60">{idx + 1} / {DRAW_PROMPTS.length}</p>
        </div>
      </div>

      <div className="w-full max-w-sm h-3 rounded-full overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${((idx + (phase === "learned" ? 1 : 0)) / DRAW_PROMPTS.length) * 100}%`, background: "var(--accent)" }} />
      </div>

      {phase === "draw" && (
        <>
          <div className="text-center">
            <span className="text-4xl">{prompt.emoji}</span>
            <p className="text-lg font-bold mt-1">Draw a {prompt.label}!</p>
            <p className="text-sm opacity-50">{prompt.hint}</p>
          </div>
          <Canvas key={canvasKey} onStrokesChange={setStrokes} />
          <button className="btn btn-primary text-xl px-8 py-4" onClick={handleDone} disabled={strokes.length === 0}>
            ✅ Done!
          </button>
        </>
      )}

      {phase === "thinking" && (
        <div className="flex flex-col items-center gap-4 mt-8 fade-in">
          <DottieBuddy mood="thinking" size={140} />
          <p className="text-xl animate-pulse">Dottie is looking at your drawing...</p>
        </div>
      )}

      {phase === "learned" && (
        <div className="flex flex-col items-center gap-4 mt-4 fade-in">
          <DottieBuddy mood="celebrate" size={140} />
          <p className="text-xl font-bold">I see a {prompt.label}! {prompt.emoji}</p>
          <p className="opacity-70">Now I know what a {prompt.label.toLowerCase()} looks like!</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {Object.entries(training).map(([cat, count]) => (
              <span key={cat} className="tag tag-steam text-sm">{cat}: {count}</span>
            ))}
          </div>
          <button className="btn btn-primary text-xl px-8 py-4" onClick={handleNext}>
            {idx + 1 >= DRAW_PROMPTS.length ? "🎉 Finish!" : "➡️ Next!"}
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-4 mt-8 fade-in">
          <DottieBuddy mood="celebrate" size={160} />
          <p className="text-2xl font-bold">🎉 Dottie learned {DRAW_PROMPTS.length} things!</p>
          <p className="opacity-70">Getting ready for the next step...</p>
        </div>
      )}
    </div>
  );
}
