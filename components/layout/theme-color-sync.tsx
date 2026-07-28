"use client";

import { useEffect } from "react";

import { isAccentColorKey } from "@/lib/theme/accent-palettes";

const STORAGE_KEY = "vex-accent";

type ThemeColorSyncProps = {
  accent: string | null;
};

function ThemeColorSync({ accent }: ThemeColorSyncProps) {
  useEffect(() => {
    if (!accent || !isAccentColorKey(accent)) {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === accent) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, accent);
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  return null;
}

export { ThemeColorSync };
