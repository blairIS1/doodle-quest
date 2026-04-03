"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { speak, stopSpeaking } from "./speak";

export type Action =
  | { type: "speak"; key: string }
  | { type: "sfx"; fn: () => void }
  | { type: "wait"; ms: number }
  | { type: "unlock" };

export type Scene = {
  id: string;
  enter: Action[];
  on: Record<string, string>;
};

export type SceneState = { sceneId: string; inputEnabled: boolean };

export function useScene(scenes: Scene[], initial: string) {
  const [state, setState] = useState<SceneState>({ sceneId: initial, inputEnabled: false });
  const cancelRef = useRef<() => void>(() => {});

  const runActions = useCallback((actions: Action[], sceneId: string) => {
    let cancelled = false;
    stopSpeaking();
    cancelRef.current();
    cancelRef.current = () => { cancelled = true; };

    setState({ sceneId, inputEnabled: false });

    (async () => {
      for (const action of actions) {
        if (cancelled) return;
        switch (action.type) {
          case "speak":
            await speak(action.key);
            break;
          case "sfx":
            action.fn();
            break;
          case "wait":
            await new Promise<void>((r) => {
              const t = setTimeout(r, action.ms);
              const check = () => { if (cancelled) { clearTimeout(t); r(); } };
              const id = setInterval(check, 50);
              setTimeout(() => clearInterval(id), action.ms + 100);
            });
            break;
          case "unlock":
            if (!cancelled) setState((s) => ({ ...s, inputEnabled: true }));
            break;
        }
      }
    })();
  }, []);

  useEffect(() => {
    const scene = scenes.find((s) => s.id === state.sceneId);
    if (scene) runActions(scene.enter, scene.id);
    return () => { cancelRef.current(); stopSpeaking(); };
  }, [state.sceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback((event: string) => {
    const scene = scenes.find((s) => s.id === state.sceneId);
    if (!scene) return;
    const next = scene.on[event];
    if (next) {
      stopSpeaking();
      cancelRef.current();
      setState({ sceneId: next, inputEnabled: false });
    }
  }, [state.sceneId, scenes]);

  return { state, send };
}
