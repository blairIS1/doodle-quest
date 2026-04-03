import type { Metadata } from "next";
import "./globals.css";
import ThemeWrapper from "./ThemeWrapper";

export const metadata: Metadata = {
  title: "🖍️ Doodle Quest — Teach AI to See!",
  description: "Draw pictures to teach Dottie the crayon how to see! A fun AI learning game for kids ages 3-8.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ThemeWrapper>{children}</ThemeWrapper></body>
    </html>
  );
}
