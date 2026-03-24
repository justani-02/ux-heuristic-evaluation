import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(() => getResolvedTheme(getInitialTheme()));

  useEffect(() => {
    const apply = () => {
      const r = getResolvedTheme(theme);
      setResolved(r);
      document.documentElement.classList.toggle("dark", r === "dark");
    };
    apply();
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  return { theme, resolved, setTheme };
}
