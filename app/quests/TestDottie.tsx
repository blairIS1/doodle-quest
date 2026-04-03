"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Canvas from "./Canvas";
import DottieBuddy from "./DottieBuddy";
import Confetti from "./Confetti";
import { DRAW_PROMPTS, TrainingData, Stroke, classify, CAT_LABELS } from "./data";
import { sfxTap, sfxCorrect, sfxWrong } from "./sfx";
import { speak, stopSpeaking } from "./speak";
import { VOICE } from "./voice";

type Props = { training: TrainingData; onComplete: (retrain: boolean) => void };

const ROUNDS = 4;

export default function TestDottie({ training, onComplete }: Props) {
  const [step, setStep] = useState<"pick" | "draw" | "guess" | "result">("pick");
  const [roundIdx, setRoundIdx] = useState(0);
  const [chosen, setChosen] = useState<typeof DRAW_PROMPTS[0] | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [guessResult, setGuessResult] = useState<{ correct: boolean; confidence: number } | null>(null);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const mistakesRef = useRef(0);
  const didSpeak = useRef(false);

  const getOptions = useCallback(() => {
    const shuffled = [...DRAW_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, []);
  const [options, setOptions] = useState(getOptions);

  useEffect(() => {
    if (didSpeak.current) return;
    didSpeak.current = true;
    speak(VOICE.q2Start).then(() => speak(VOICE.q2Pick));
    return () => { stopSpeaking(); };
  }, []);

  const pick = (prompt: typeof DRAW_PROMPTS[0]) => {
    sfxTap();
    setChosen(prompt);
    setStrokes([]);
    setCanvasKey((k) => k + 1);
    setStep("draw");
    stopSpeaking();
    speak(VOICE[prompt.voiceKey]);
  };

  const handleDone = () => {
    if (!chosen || strokes.length === 0) return;
    sfxTap();
    setStep("guess");
    stopSpeaking();
    speak(VOICE.thinking).then(() => {
      const guesses = classify(strokes, training);
      const topGuess = guesses[0];
      const correct = topGuess.id === chosen.id;
      const confidence = topGuess.confidence;
      setGuessResult({ correct, confidence });
      if (correct) {
        sfxCorrect();
        setShowConfetti(true);
        setScore((s) => s + 1);
        speak(VOICE.guessRight);
      } else {
        const hasData = (training[chosen.category] || 0) > 0;
        sfxWrong();
        mistakesRef.current++;
        speak(hasData ? VOICE.guessWrong : VOICE.guessNoData);
      }
      setStep("result");
    });
  };

  const nextRound = () => {
    sfxTap();
    setShowConfetti(false);
    setGuessResult(null);
    if (roundIdx + 1 >= ROUNDS) {
      stopSpeaking();
      speak(VOICE.q2Done).then(() => speak(VOICE.q2Learned)).then(() => {
        onComplete(mistakesRef.current >= 3);
      });
    } else {
      setRoundIdx((i) => i + 1);
      setChosen(null);
      setStrokes([]);
      setStep("pick");
      setOptions(getOptions());
      stopSpeaking();
      speak(VOICE.q2Pick);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen gap-4 p-4 fade-in">
      <Confetti active={showConfetti} />
      <div className="flex items-center gap-3">
        <DottieBuddy mood={step === "guess" ? "thinking" : guessResult?.correct && step === "result" ? "happy" : "idle"} size={80} />
        <div>
          <h2 className="text-xl font-bold">🔍 Can Dottie Guess?</h2>
          <p className="text-sm opacity-60">Round {roundIdx + 1} / {ROUNDS} · Score: {score}</p>
        </div>
      </div>

      {step === "pick" && (
        <div className="flex flex-col items-center gap-4 mt-4 fade-in">
          <p className="text-lg">Pick something to draw!</p>
          <div className="flex gap-4">
            {options.map((o) => (
              <button key={o.id} className="btn btn-primary flex flex-col items-center gap-2 text-lg px-6 py-4" onClick={() => pick(o)}>
                <span className="text-4xl">{o.emoji}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "draw" && chosen && (
        <div className="flex flex-col items-center gap-3 fade-in">
          <p className="text-lg">Draw a <span className="font-bold">{chosen.label}</span> {chosen.emoji}</p>
          <Canvas key={canvasKey} onStrokesChange={setStrokes} />
          <button className="btn btn-primary text-xl px-8 py-4" onClick={handleDone} disabled={strokes.length === 0}>
            ✅ Done!
          </button>
        </div>
      )}

      {step === "guess" && (
        <div className="flex flex-col items-center gap-4 mt-8 fade-in">
          <DottieBuddy mood="thinking" size={140} />
          <p className="text-xl animate-pulse">Dottie is guessing...</p>
        </div>
      )}

      {step === "result" && chosen && guessResult && (
        <div className="flex flex-col items-center gap-4 mt-4 fade-in">
          <DottieBuddy mood={guessResult.correct ? "celebrate" : "scared"} size={120} />
          {guessResult.correct ? (
            <p className="text-xl font-bold" style={{ color: "var(--success)" }}>✅ Dottie guessed {chosen.label}! Correct!</p>
          ) : (
            <p className="text-xl font-bold" style={{ color: "var(--warn)" }}>🤔 Dottie wasn&apos;t sure about that one</p>
          )}
          {!guessResult.correct && (training[chosen.category] || 0) === 0 && (
            <p className="text-sm opacity-70">Dottie never learned about {CAT_LABELS[chosen.category].label}!</p>
          )}
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-sm mb-1">
              <span>Confidence</span>
              <span>{guessResult.confidence}%</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--card)" }}>
              <div className="h-full rounded-full" style={{
                width: `${guessResult.confidence}%`,
                background: guessResult.correct ? "var(--success)" : "var(--warn)",
              }} />
            </div>
          </div>
          <button className="btn btn-primary text-xl px-8 py-4" onClick={nextRound}>
            {roundIdx + 1 >= ROUNDS ? "🎉 Finish!" : "➡️ Next!"}
          </button>
        </div>
      )}
    </div>
  );
}
