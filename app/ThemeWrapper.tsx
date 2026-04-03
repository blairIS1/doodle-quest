"use client";
import ThemeProvider from "./quests/ThemeProvider";
import { GAME_THEME } from "./quests/gameTheme";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={GAME_THEME}>{children}</ThemeProvider>;
}
