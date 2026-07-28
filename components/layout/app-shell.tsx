import * as React from "react";

import { LocalePreferenceSync } from "@/components/layout/locale-preference-sync";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { PageHeader } from "@/components/layout/page-header";
import {
  TopNavigation,
  type TopNavigationEntry,
} from "@/components/layout/top-navigation";
import { UserMenu } from "@/components/layout/user-menu";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  contentFrameless?: boolean;
  locale: string;
  userName?: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  userMenuAriaLabel?: string;
  topNavigationItems?: TopNavigationEntry[];
  mobileNavLabel?: string;
  mobileNavTriggerLabel?: string;
};

function AppShell({
  children,
  sidebar,
  title,
  description,
  actions,
  contentFrameless = false,
  locale,
  userName,
  userEmail,
  userAvatarUrl,
  userMenuAriaLabel,
  topNavigationItems,
  mobileNavLabel = "Menu",
  mobileNavTriggerLabel = "Open navigation menu",
}: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <LocalePreferenceSync locale={locale} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_4%_4%,hsl(var(--primary)/0.24),transparent_34%),radial-gradient(circle_at_96%_8%,hsl(var(--info)/0.2),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.32))]"
      />

      <div
        className={cn(
          "relative mx-auto grid min-h-screen w-full max-w-[1800px] grid-cols-1 gap-6 px-4 pb-8 pt-5 sm:px-6 lg:gap-8 lg:px-10 xl:px-14",
          sidebar ? "lg:grid-cols-[300px_minmax(0,1fr)]" : "lg:grid-cols-1",
        )}
      >
        {sidebar ? (
          <aside className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:self-start">
            <Card className="glass-panel glass-glow h-full overflow-hidden border-sidebar-border/90 bg-sidebar/80 text-sidebar-foreground shadow-xl">
              <div className="border-b border-sidebar-border bg-linear-to-br from-sidebar via-sidebar to-sidebar-accent/75 px-5 py-5">
                <p className="brand-wordmark text-xs tracking-[0.26em] text-sidebar-foreground/80">
                  Vex
                </p>
              </div>
              <div className="space-y-4 px-3 py-4">{sidebar}</div>
            </Card>
          </aside>
        ) : null}

        <main className="min-w-0">
          <div className="flex min-w-0 flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 md:gap-6">
            <div className="glass-soft flex items-center justify-between gap-3 rounded-xl px-4 py-3 lg:hidden">
              <div className="min-w-0">
                <p className="brand-wordmark text-xs tracking-[0.26em] text-muted-foreground">
                  Vex
                </p>
                {title ? (
                  <p className="truncate text-sm font-medium text-foreground">
                    {title}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {topNavigationItems && topNavigationItems.length > 0 ? (
                  <MobileNavSheet
                    items={topNavigationItems}
                    navLabel={mobileNavLabel}
                    triggerLabel={mobileNavTriggerLabel}
                  />
                ) : null}
                <UserMenu
                  locale={locale}
                  name={userName}
                  email={userEmail}
                  avatarUrl={userAvatarUrl}
                  ariaLabel={userMenuAriaLabel}
                />
              </div>
            </div>
            <div className="glass-panel hidden items-center justify-between gap-3 rounded-2xl px-5 py-4 lg:flex">
              <div className="flex min-w-0 items-center gap-5">
                <div>
                  <p className="brand-wordmark text-xs tracking-[0.24em] text-primary/90 uppercase">
                    Vex
                  </p>
                  {title ? (
                    <p className="text-sm text-muted-foreground">{title}</p>
                  ) : null}
                </div>
                {topNavigationItems && topNavigationItems.length > 0 ? (
                  <TopNavigation items={topNavigationItems} />
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <UserMenu
                  locale={locale}
                  name={userName}
                  email={userEmail}
                  avatarUrl={userAvatarUrl}
                  ariaLabel={userMenuAriaLabel}
                />
              </div>
            </div>
            {title || description || actions ? (
              <PageHeader
                title={title}
                description={description}
                actions={actions}
              />
            ) : null}
            <div
              className={cn(
                "min-w-0",
                contentFrameless
                  ? ""
                  : "glass-panel rounded-2xl p-4 ring-1 ring-primary/10 sm:p-5 lg:p-6",
              )}
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
