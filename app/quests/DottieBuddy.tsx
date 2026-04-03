"use client";

type Mood = "idle" | "happy" | "thinking" | "scared" | "celebrate";

export default function DottieBuddy({ mood = "idle", size = 120 }: { mood?: Mood; size?: number }) {
  const bounce = mood === "celebrate" ? "animate-bounce" : mood === "happy" ? "animate-pulse" : "";
  const wiggle = mood === "scared" ? { animation: "wiggle 0.3s infinite alternate" } : {};

  return (
    <div className={`flex flex-col items-center ${bounce}`} style={{ ...wiggle, fontSize: size * 0.6 }}>
      <div style={{ fontSize: size * 0.8 }}>
        {mood === "thinking" ? "🖍️🤔" : mood === "scared" ? "🖍️😵‍💫" : mood === "celebrate" ? "🖍️🥳" : "🖍️"}
      </div>
      {mood === "celebrate" && <div className="text-xs mt-1">✨🎨✨</div>}
    </div>
  );
}
