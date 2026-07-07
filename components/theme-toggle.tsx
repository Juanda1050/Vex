"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cotify-theme";
const THEME_EVENT = "cotify-theme-change";

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

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => onStoreChange();

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener(THEME_EVENT, handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(THEME_EVENT, handleChange);
  };
}

function ThemeToggle() {
  const isDark = React.useSyncExternalStore(
    subscribe,
    getPreferredTheme,
    () => false,
  );

  const toggleTheme = React.useCallback(() => {
    applyTheme(!isDark);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [isDark]);

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
