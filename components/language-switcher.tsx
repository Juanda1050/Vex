"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const SUPPORTED_LOCALES = ["es", "en"] as const;

type AppLocale = (typeof SUPPORTED_LOCALES)[number];

type LanguageSwitcherProps = {
  locale: string;
  className?: string;
};

function isSupportedLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

function LanguageSwitcher({ locale, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLocale: AppLocale = isSupportedLocale(locale) ? locale : "es";

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

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-md p-1", className)}
      role="group"
      aria-label="Language switcher"
    >
      {SUPPORTED_LOCALES.map((targetLocale) => {
        const isActive = targetLocale === activeLocale;

        return (
          <Link
            key={targetLocale}
            href={toLocaleHref(targetLocale)}
            className={cn(
              "rounded-sm px-2 py-1 text-xs font-semibold tracking-wide uppercase transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            hrefLang={targetLocale}
            aria-current={isActive ? "page" : undefined}
          >
            {targetLocale}
          </Link>
        );
      })}
    </div>
  );
}

export { LanguageSwitcher };
