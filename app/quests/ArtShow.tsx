"use client";
import { useState, useEffect, useRef } from "react";
import Canvas, { CanvasHandle } from "./Canvas";
import DottieBuddy from "./DottieBuddy";
import Confetti from "./Confetti";
import { DRAW_PROMPTS, TrainingData, Stroke, classify } from "./data";
import { sfxTap, sfxCorrect, sfxCelebrate } from "./sfx";
import { speak, stopSpeaking } from "./speak";
import { VOICE } from "./voice";

type Props = { training: TrainingData; onComplete: () => void };

type SavedArt = { dataURL: string; label: string; emoji: string };

const ROUNDS = 3;

export default function ArtShow({ training, onComplete }: Props) {
  const [step, setStep] = useState<"draw" | "guess" | "label" | "saved">("draw");
  const [roundIdx, setRoundIdx] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [topGuesses, setTopGuesses] = useState<{ label: string; emoji: string; confidence: number }[]>([]);
  const [gallery, setGallery] = useState<SavedArt[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const canvasRef = useRef<CanvasHandle>(null);
  const lastDataURL = useRef("");
  const didSpeak = useRef(false);

  useEffect(() => {
    if (didSpeak.current) return;
    didSpeak.current = true;
    speak(VOICE.q3Start);
    return () => { stopSpeaking(); };
  }, []);

  const handleDone = () => {
    if (strokes.length === 0) return;
    sfxTap();
    // Capture canvas before transitioning away
    lastDataURL.current = canvasRef.current?.toDataURL() || "";
    setStep("guess");
    stopSpeaking();
    speak(VOICE.q3Guessing).then(() => {
      const guesses = classify(strokes, training);
      setTopGuesses(guesses.slice(0, 3));
      setStep("label");
    });
  };

  const handleLabel = (label: string, emoji: string) => {
    sfxCorrect();
    setShowConfetti(true);
    const dataURL = lastDataURL.current;
    setGallery((g) => [...g, { dataURL, label, emoji }]);

    try {
      const existing = JSON.parse(localStorage.getItem("doodle_gallery") || "[]");
      existing.push({ dataURL, label, emoji, date: new Date().toISOString() });
      localStorage.setItem("doodle_gallery", JSON.stringify(existing));
    } catch { /* ignore */ }

    speak(VOICE.q3Saved).then(() => setStep("saved"));
  };

  const shareDrawing = () => {
    const last = gallery[gallery.length - 1];
    if (!last?.dataURL) return;
    const a = document.createElement("a");
    a.href = last.dataURL;
    a.download = `doodle-${last.label.toLowerCase()}.png`;
    a.click();
  };

  const nextRound = () => {
    sfxTap();
    setShowConfetti(false);
    setStrokes([]);
    setTopGuesses([]);
    setCanvasKey((k) => k + 1);
    if (roundIdx + 1 >= ROUNDS) {
      sfxCelebrate();
      stopSpeaking();
      speak(VOICE.q3Done).then(() => speak(VOICE.q3Learned)).then(() => onComplete());
    } else {
      setRoundIdx((i) => i + 1);
      setStep("draw");
      stopSpeaking();
      speak(VOICE.q3Start);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen gap-4 p-4 fade-in">
      <Confetti active={showConfetti} />
      <div className="flex items-center gap-3">
        <DottieBuddy mood={step === "guess" ? "thinking" : step === "saved" ? "celebrate" : "idle"} size={80} />
        <div>
          <h2 className="text-xl font-bold">🎨 Art Show!</h2>
          <p className="text-sm opacity-60">Drawing {roundIdx + 1} / {ROUNDS}</p>
        </div>
      </div>

      {gallery.length > 0 && (
        <div className="flex gap-2 overflow-x-auto w-full max-w-sm">
          {gallery.map((art, i) => (
            <div key={i} className="flex flex-col items-center shrink-0">
              <div className="w-16 h-16 rounded-lg border-2 border-white/20 overflow-hidden" style={{ background: "#fff" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art.dataURL} alt={art.label} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs">{art.emoji}</span>
            </div>
          ))}
        </div>
      )}

      {step === "draw" && (
        <div className="flex flex-col items-center gap-3 fade-in">
          <p className="text-lg">Draw anything you want! 🎨</p>
          <Canvas key={canvasKey} ref={canvasRef} onStrokesChange={setStrokes} />
          <button className="btn btn-primary text-xl px-8 py-4" onClick={handleDone} disabled={strokes.length === 0}>
            ✅ Show Dottie!
          </button>
        </div>
      )}

      {step === "guess" && (
        <div className="flex flex-col items-center gap-4 mt-8 fade-in">
          <DottieBuddy mood="thinking" size={140} />
          <p className="text-xl animate-pulse">Dottie is looking...</p>
        </div>
      )}

      {step === "label" && (
        <div className="flex flex-col items-center gap-4 fade-in">
          <p className="text-lg font-bold">Dottie&apos;s guesses:</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {topGuesses.map((g, i) => (
              <div key={g.label} className="flex items-center gap-3 rounded-xl p-2" style={{ background: "var(--card)" }}>
                <span className="text-2xl">{g.emoji}</span>
                <span className="flex-1">{g.label}</span>
                <span className="text-sm opacity-60">{g.confidence}%</span>
                {i === 0 && <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--accent)", color: "#000" }}>Top guess</span>}
              </div>
            ))}
          </div>
          <p className="text-base mt-2">What did you actually draw?</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {DRAW_PROMPTS.map((p) => (
              <button key={p.id} className="btn flex flex-col items-center gap-1 px-4 py-3" onClick={() => handleLabel(p.label, p.emoji)}>
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-xs">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="flex flex-col items-center gap-4 fade-in">
          <DottieBuddy mood="celebrate" size={120} />
          <p className="text-xl font-bold" style={{ color: "var(--success)" }}>🖼️ Saved to the gallery!</p>
          <div className="flex gap-3">
            <button className="btn text-lg px-6 py-3" onClick={shareDrawing}>📤 Save Drawing</button>
            <button className="btn btn-primary text-xl px-8 py-4" onClick={nextRound}>
              {roundIdx + 1 >= ROUNDS ? "🎉 Finish!" : "➡️ Next!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
