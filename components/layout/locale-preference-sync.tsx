"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

function LocalePreferenceSync({ locale }: LocalePreferenceSyncProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !isSupportedLocale(locale)) {
      return;
    }

    const storedLocale = window.localStorage.getItem(STORAGE_KEY);

    if (!storedLocale || !isSupportedLocale(storedLocale)) {
      window.localStorage.setItem(STORAGE_KEY, locale);
      return;
    }

    if (storedLocale === locale) {
      return;
    }

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0 || !isSupportedLocale(segments[0] ?? "")) {
      return;
    }

    segments[0] = storedLocale;

    const query = searchParams.toString();
    const nextPath = `/${segments.join("/")}`;

    router.replace(query ? `${nextPath}?${query}` : nextPath);
  }, [locale, pathname, router, searchParams]);

  return null;
}

export { LocalePreferenceSync };
