"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { logoutAction } from "@/server/auth/actions/logout.action";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGE_STORAGE_KEY = "vex-locale";
const SUPPORTED_LOCALES = ["es", "en"] as const;

type PreferencesPanelProps = {
  locale: string;
};

function isSupportedLocale(
  value: string,
): value is (typeof SUPPORTED_LOCALES)[number] {
  return SUPPORTED_LOCALES.includes(
    value as (typeof SUPPORTED_LOCALES)[number],
  );
}

function PreferencesPanel({ locale }: PreferencesPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("settings");
  const selectedLocale = isSupportedLocale(locale) ? locale : "es";

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLocale);
  }, [selectedLocale]);

  const languageOptions = useMemo(
    () => [
      { value: "es", label: t("preferences.languages.es") },
      { value: "en", label: t("preferences.languages.en") },
    ],
    [t],
  );

  const onLanguageChange = (nextLocale: string) => {
    if (!pathname || !isSupportedLocale(nextLocale)) {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0 || !isSupportedLocale(segments[0] ?? "")) {
      return;
    }

    segments[0] = nextLocale;

    const query = searchParams.toString();
    const nextPath = `/${segments.join("/")}`;

    router.replace(query ? `${nextPath}?${query}` : nextPath);
  };

  return (
    <div className="grid gap-4">
      <Card id="preferences-language" className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("preferences.title")}</CardTitle>
          <CardDescription>{t("preferences.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("fields.language")}
            </p>
            <Select value={selectedLocale} onValueChange={onLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("preferences.theme")}
            </p>
            <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/80 px-2 py-1.5">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                {t("preferences.themeHint")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="account-security" className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("account.title")}</CardTitle>
          <CardDescription>{t("account.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button type="submit" variant="destructive" size="sm">
              {t("account.logout")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { PreferencesPanel };
