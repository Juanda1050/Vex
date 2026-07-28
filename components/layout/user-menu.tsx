"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Settings } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  locale: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
  ariaLabel?: string;
};

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function UserMenu({
  locale,
  email,
  name,
  avatarUrl,
  ariaLabel,
}: UserMenuProps) {
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tDashboard = useTranslations("dashboard");
  const tSettings = useTranslations("settings");
  const displayName = name?.trim() || email;
  const settingsPath = `/${locale}/settings`;
  const logoutSettingsPath = `${settingsPath}#account-security`;

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 px-1 py-1 transition hover:opacity-85"
            aria-label={ariaLabel ?? tDashboard("openUserMenu")}
          />
        }
      >
        <span className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-primary/25 bg-primary/10 text-xs font-semibold text-primary">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-32 truncate text-left text-xs font-medium text-foreground sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {tSettings("language")}
          </span>
          <LanguageSwitcher
            locale={locale}
            className="rounded-full bg-muted p-0.5"
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {tSettings("theme")}
          </span>
          <ThemeToggle className="rounded-full border-0 bg-muted shadow-none hover:bg-accent" />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(settingsPath)}>
          <Settings className="size-4" />
          {tNav("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(logoutSettingsPath)}>
          <LogOut className="size-4" />
          {tNav("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
