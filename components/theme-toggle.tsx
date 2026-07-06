"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cotify-theme";

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "dark") {
    return true;
  }

  if (storedTheme === "light") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
}

function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(getPreferredTheme);

  React.useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (!storedTheme) {
        setIsDark(event.matches);
      }
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const toggleTheme = React.useCallback(() => {
    setIsDark((currentValue) => {
      const nextValue = !currentValue;
      applyTheme(nextValue);
      return nextValue;
    });
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="shrink-0 border-sidebar-border bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

export { ThemeToggle };
