"use client";

import {
  startTransition,
  useActionState,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "lucide-react";

import {
  updateThemeColorAction,
  type ActionResult,
} from "@/app/actions/settings";
import { cn } from "@/lib/utils";
import {
  ACCENT_COLOR_KEYS,
  DEFAULT_ACCENT_COLOR,
  isAccentColorKey,
  type AccentColorKey,
} from "@/lib/theme/accent-palettes";

const STORAGE_KEY = "vex-accent";

const initialState: ActionResult = { success: false, error: null };

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot(): AccentColorKey {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isAccentColorKey(stored) ? stored : DEFAULT_ACCENT_COLOR;
}

function getServerSnapshot(): AccentColorKey {
  return DEFAULT_ACCENT_COLOR;
}

function ThemeColorPicker() {
  const t = useTranslations("settings");
  const selected = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [state, submitThemeColor, isPending] = useActionState(
    updateThemeColorAction,
    initialState,
  );
  const [previewKey, setPreviewKey] = useState<AccentColorKey | null>(null);
  const previewedKey = previewKey ?? selected;

  const applyColor = (key: AccentColorKey) => {
    document.documentElement.setAttribute("data-accent", key);
    window.localStorage.setItem(STORAGE_KEY, key);
    window.dispatchEvent(new Event("storage"));

    const formData = new FormData();
    formData.set("themeColor", key);
    startTransition(() => {
      submitThemeColor(formData);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {ACCENT_COLOR_KEYS.map((key) => {
          const isSelected = key === selected;

          return (
            <button
              key={key}
              type="button"
              onClick={() => applyColor(key)}
              onMouseEnter={() => setPreviewKey(key)}
              onMouseLeave={() => setPreviewKey(null)}
              onFocus={() => setPreviewKey(key)}
              onBlur={() => setPreviewKey(null)}
              aria-pressed={isSelected}
              aria-label={t(`appearance.colors.${key}`)}
              title={t(`appearance.colors.${key}`)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-lg p-2 transition",
                "hover:bg-accent/40",
              )}
            >
              <span
                data-accent-swatch={key}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                  isSelected ? "ring-foreground/70" : "ring-transparent",
                )}
                style={{
                  background: `hsl(var(--accent-swatch-${key}))`,
                }}
              >
                {isSelected ? (
                  <CheckIcon className="size-4 text-white drop-shadow-sm" />
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                {t(`appearance.colors.${key}`)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 px-3.5 py-3">
        <span className="text-xs font-medium text-muted-foreground">
          {t("appearance.previewLabel")}
        </span>
        <button
          type="button"
          tabIndex={-1}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-sm transition"
          style={{ background: `hsl(var(--accent-swatch-${previewedKey}))` }}
        >
          {t("appearance.previewButton")}
        </button>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium text-white transition"
          style={{
            background: `hsl(var(--accent-swatch-${previewedKey}) / 0.85)`,
          }}
        >
          {t("appearance.previewBadge")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {isPending
          ? t("appearance.saving")
          : state.success
            ? t("appearance.saved")
            : t("appearance.hint")}
      </p>
    </div>
  );
}

export { ThemeColorPicker };
