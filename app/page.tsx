"use client";
import { useState, useEffect, useRef } from "react";
import TeachDottie from "./quests/TeachDottie";
import TrainingSummary from "./quests/TrainingSummary";
import TestDottie from "./quests/TestDottie";
import ArtShow from "./quests/ArtShow";
import DottieBuddy from "./quests/DottieBuddy";
import Confetti from "./quests/Confetti";
import SessionTimer, { useSessionTimer } from "./quests/SessionTimer";
import { useSpeaking } from "./quests/SpeakingIndicator";
import { sfxTap, sfxCelebrate } from "./quests/sfx";
import { speak, stopSpeaking } from "./quests/speak";
import { startMusic, stopMusic } from "./quests/music";
import { recordCompletion, getCompletions } from "./quests/scores";
import { TrainingData } from "./quests/data";
import { VOICE } from "./quests/voice";

const PARTS = [
  { emoji: "🖍️", label: "Crayon" },
  { emoji: "👁️", label: "Eyes" },
  { emoji: "🖼️", label: "Frame" },
  { emoji: "🎨", label: "Palette" },
  { emoji: "🏆", label: "Trophy" },
];
const QUESTS = [
  { name: "🖍️ Teach Dottie" },
  { name: "🔍 Test Dottie" },
  { name: "🎨 Art Show" },
];

type Phase = "start" | "menu" | "q1" | "summary" | "q2" | "q3";

const VALID_PHASES: Phase[] = ["start", "menu", "q1", "summary", "q2", "q3"];
const FAKE_TRAINING: TrainingData = { animal: 2, nature: 2, thing: 2 };

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const [completed, setCompleted] = useState([false, false, false]);
  const [training, setTraining] = useState<TrainingData>({});
  const [completions, setCompletions] = useState(0);
  const { expired, dismiss } = useSessionTimer();

  useEffect(() => { setCompletions(getCompletions()); }, []);

  // Debug: ?phase=q2 jumps directly to that phase with fake training data
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("phase") as Phase | null;
    if (p && VALID_PHASES.includes(p)) {
      setTraining(FAKE_TRAINING);
      setPhase(p);
    }
  }, []);

  const markDone = (i: number) => setCompleted((p) => { const n = [...p]; n[i] = true; return n; });
  const talking = useSpeaking();

  const startingRef = useRef(false);
  const startGame = () => {
    if (startingRef.current) return;
    startingRef.current = true;
    stopSpeaking();
    sfxTap();
    startMusic("pentatonic");
    speak(VOICE.welcome).then(() => { setPhase("menu"); speak(VOICE.menuSubtitle); });
  };

  const startQuest = (p: Phase) => { stopSpeaking(); sfxTap(); setPhase(p); };

  if (expired) { stopMusic(); return <SessionTimer onDismiss={dismiss} />; }

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 fade-in">
        <DottieBuddy mood="idle" size={160} talking={talking} />
        <h1 className="text-3xl sm:text-5xl font-bold text-center">🖍️ Doodle Quest</h1>
        <p className="text-base sm:text-xl text-center opacity-80 max-w-2xl px-4">Draw pictures to teach Dottie the crayon how to see!</p>
        <button className="btn btn-primary text-xl sm:text-2xl px-8 py-4" onClick={startGame}>🎮 Start Drawing!</button>
        {completions > 0 && <p className="text-sm opacity-40">🏆 Completed {completions} time{completions > 1 ? "s" : ""}!</p>}
      </div>
    );
  }

  if (phase === "menu") {
    const phases: Phase[] = ["q1", "q2", "q3"];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 fade-in">
        <Confetti active={completed.every(Boolean)} />
        <DottieBuddy mood={completed.every(Boolean) ? "celebrate" : "idle"} size={140} talking={talking} />
        <h1 className="text-3xl sm:text-4xl font-bold text-center">Doodle Quest!</h1>
        <p className="text-base sm:text-lg text-center opacity-70 max-w-md px-4">Collect all art tools by teaching Dottie to see!</p>
        <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
          {PARTS.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1" style={{ opacity: completed[Math.min(i, 2)] ? 1 : 0.3 }}>
              <span className="text-2xl sm:text-3xl" style={{ filter: completed[Math.min(i, 2)] ? "none" : "grayscale(1)" }}>{p.emoji}</span>
              <span className="text-xs">{p.label}</span>
            </div>
          ))}
        </div>
        <div className="text-sm opacity-60">{completed.filter(Boolean).length}/3 quests</div>
        <div className="flex flex-col gap-3 w-full max-w-sm px-4">
          {QUESTS.map((q, i) => (
            <button key={i} className="btn btn-primary flex justify-between items-center text-sm sm:text-base"
              style={{ opacity: i === 0 || completed[i - 1] ? 1 : 0.4 }}
              disabled={i > 0 && !completed[i - 1]}
              onClick={() => startQuest(phases[i])}>
              <span>{q.name}</span>
              {completed[i] ? <span>✅</span> : <span className="opacity-40">{PARTS[i].emoji}</span>}
            </button>
          ))}
        </div>
        {completed.every(Boolean) && (
          <div className="text-lg sm:text-xl font-bold text-center fade-in px-4" style={{ color: "var(--success)" }}>
            🎉 You taught Dottie to see! You&apos;re the best artist!
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {phase === "q1" && (
        <TeachDottie onComplete={(data) => {
          setTraining((prev) => {
            const m = { ...prev };
            for (const [k, v] of Object.entries(data)) m[k] = (m[k] || 0) + v;
            return m;
          });
          markDone(0);
          setPhase("summary");
        }} />
      )}
      {phase === "summary" && <TrainingSummary training={training} onComplete={() => setPhase("q2")} />}
      {phase === "q2" && (
        <TestDottie training={training} onComplete={(retrain) => {
          if (retrain) { setPhase("q1"); }
          else { markDone(1); setPhase("q3"); }
        }} />
      )}
      {phase === "q3" && (
        <ArtShow training={training} onComplete={() => {
          markDone(2);
          setCompletions(recordCompletion());
          sfxCelebrate();
          speak(VOICE.allDone).then(() => setPhase("menu"));
        }} />
      )}
    </>
  );
}
