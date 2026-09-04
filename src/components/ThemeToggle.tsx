"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();

  const next: Record<typeof theme, typeof theme> = {
    light: "dark",
    dark: "system",
    system: "light",
  };

  const label = {
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  };

  const icon = {
    light: "Sol",
    dark: "Luna",
    system: "Auto",
  };

  return (
    <button
      onClick={() => setTheme(next[theme])}
      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-card-foreground hover:bg-surface transition-colors cursor-pointer"
      aria-label={`Tema actual: ${label[theme]}. Cambiar a ${label[next[theme]]}`}
      title={`Tema: ${label[theme]} (click para ${label[next[theme]]})`}
    >
      <span className="sm:hidden">{icon[theme]}</span>
      <span className="hidden sm:inline">{label[resolved]}</span>
    </button>
  );
}
