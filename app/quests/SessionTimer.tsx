"use client";
import { useState, useEffect, useCallback } from "react";
import { stopMusic } from "./music";

const SESSION_MINUTES = 12;

export function useSessionTimer() {
  const [expired, setExpired] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExpired(true), SESSION_MINUTES * 60 * 1000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);
  return { expired: expired && !dismissed, dismiss };
}

export default function SessionTimer({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => { stopMusic(); }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 fade-in">
      <div className="text-6xl">😴</div>
      <h2 className="text-3xl font-bold text-center">Time for a Break!</h2>
      <p className="text-lg opacity-80 text-center max-w-md">
        You&apos;ve been playing for {SESSION_MINUTES} minutes. Your eyes and brain need a rest!
      </p>
      <p className="text-base opacity-60 text-center">
        Look out the window at something far away for 20 seconds 👀
      </p>
      <button className="btn btn-primary mt-4" onClick={onDismiss}>
        I&apos;m Ready to Continue! 🚀
      </button>
    </div>
  );
}
