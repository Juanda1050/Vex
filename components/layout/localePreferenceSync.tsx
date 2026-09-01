"use client";

import { useEffect } from "react";

const STORAGE_KEY = "vex-locale";
const SUPPORTED_LOCALES = ["es", "en"] as const;

type LocalePreferenceSyncProps = {
  locale: string;
};

function isSupportedLocale(
  value: string,
): value is (typeof SUPPORTED_LOCALES)[number] {
  return SUPPORTED_LOCALES.includes(
    value as (typeof SUPPORTED_LOCALES)[number],
  );
}

/**
 * Persists the URL locale as the user's last-used preference. Never
 * redirects — the URL is always the source of truth. (It used to force a
 * redirect back to the stored locale, which broke manual language switching:
 * every switch attempt snapped straight back to the old language.)
 */
function LocalePreferenceSync({ locale }: LocalePreferenceSyncProps) {
  useEffect(() => {
    if (!isSupportedLocale(locale)) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return null;
}

export { LocalePreferenceSync };
