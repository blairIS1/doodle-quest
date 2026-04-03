"use client";
import { useEffect } from "react";
import { ThemeConfig } from "./theme.config";

export default function ThemeProvider({ theme, children }: { theme: ThemeConfig; children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = theme;
    root.style.setProperty("--bg", colors.bg);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--success", colors.success);
    root.style.setProperty("--warn", colors.warn);
    root.style.setProperty("--text", colors.text);
  }, [theme]);

  return <>{children}</>;
}
