"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const SUPPORTED_LOCALES = ["es", "en"] as const;

type AppLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

type PublicControlsProps = {
  locale: string;
};

const authLanguageLinkClassName = cn(
  "relative text-xs font-semibold tracking-[0.24em] uppercase text-foreground/72 transition-all duration-300",
  "hover:text-foreground hover:tracking-[0.28em]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
);

const authThemeToggleClassName = cn(
  "size-7 border-0 bg-transparent p-0 text-foreground/72 shadow-none",
  "backdrop-blur-none transition-all duration-300",
  "hover:bg-transparent hover:text-foreground active:shadow-none",
  "focus-visible:ring-2 focus-visible:ring-ring/60",
);

export function PublicControls({ locale }: PublicControlsProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const activeLocale: AppLocale = isSupportedLocale(locale) ? locale : "es";
  const isOnboardingRoute = /\/(es|en)\/onboarding(?:\/|$)/.test(pathname);
  const isAuthRoute = /\/(es|en)\/(login|register)(?:\/|$)/.test(pathname);

  const toLocaleHref = (nextLocale: AppLocale) => {
    if (!pathname) {
      return `/${nextLocale}`;
    }

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return `/${nextLocale}`;
    }

    if (isSupportedLocale(segments[0] ?? "")) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }

    const query = searchParams.toString();
    const nextPath = `/${segments.join("/")}`;
    return query ? `${nextPath}?${query}` : nextPath;
  };

  const nextLocale: AppLocale = activeLocale === "es" ? "en" : "es";

  if (isOnboardingRoute) {
    return null;
  }

  if (isAuthRoute) {
    return (
      <div className="pointer-events-none absolute bottom-7 right-7 z-20 sm:bottom-9 sm:right-9">
        <div className="pointer-events-auto inline-flex items-center gap-2.5 py-1 text-foreground/90">
          <Link
            href={toLocaleHref(nextLocale)}
            hrefLang={nextLocale}
            className={authLanguageLinkClassName}
            aria-label={`Change language to ${nextLocale}`}
            title={`Change language to ${nextLocale}`}
          >
            {activeLocale}
          </Link>
          <span
            aria-hidden
            className="h-4 w-px bg-linear-to-b from-transparent via-border/85 to-transparent"
          />
          <ThemeToggle className={authThemeToggleClassName} noDarkElevation />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex justify-center sm:mb-4">
      <div className="inline-flex items-center gap-1">
        <LanguageSwitcher
          locale={locale}
          className="rounded-full border border-border/55 bg-background/70 p-0.5"
        />
        <ThemeToggle className="rounded-full border-border/55 bg-background/78 shadow-none" />
      </div>
    </div>
  );
}
