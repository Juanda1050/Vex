"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
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
        <DropdownMenuLabel className="space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
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
