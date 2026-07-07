import * as React from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  locale: string;
};

function AppShell({
  children,
  sidebar,
  title,
  description,
  actions,
  locale,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_4%_4%,hsl(var(--primary)/0.24),transparent_34%),radial-gradient(circle_at_96%_8%,hsl(var(--info)/0.2),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.32))]"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1800px] grid-cols-1 gap-6 px-4 pb-8 pt-5 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 lg:px-10 xl:px-14">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:self-start">
          <Card className="glass-panel glass-glow h-full overflow-hidden border-sidebar-border/90 bg-sidebar/80 text-sidebar-foreground shadow-xl">
            <div className="border-b border-sidebar-border bg-linear-to-br from-sidebar via-sidebar to-sidebar-accent/75 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-primary/15 text-primary ring-1 ring-primary/25"
                    >
                      Live
                    </Badge>
                    <span className="text-xs font-medium text-sidebar-foreground/62">
                      Risk telemetry
                    </span>
                  </div>
                  <p className="brand-wordmark text-xs tracking-[0.26em] text-sidebar-foreground/80">
                    Cotify
                  </p>
                  <h1 className="truncate text-lg font-semibold text-sidebar-foreground">
                    {title ?? "Workspace"}
                  </h1>
                  {description ? (
                    <p className="text-sm leading-6 text-sidebar-foreground/72">
                      {description}
                    </p>
                  ) : null}
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                  <LanguageSwitcher locale={locale} />
                  <ThemeToggle />
                </div>
              </div>
            </div>
            {sidebar ? (
              <div className="space-y-4 px-3 py-4">
                <div className="rounded-lg border border-sidebar-border bg-background/55 px-3 py-2 text-xs text-sidebar-foreground/72 backdrop-blur-sm">
                  Monitoring lane: key context and tenant access signals remain
                  pinned while you navigate operational workflows.
                </div>
                {sidebar}
              </div>
            ) : null}
          </Card>
        </aside>

        <main className="min-w-0">
          <div className="flex min-w-0 flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 md:gap-6">
            <div className="glass-soft flex items-center justify-between gap-3 rounded-xl px-4 py-3 lg:hidden">
              <div className="min-w-0">
                <p className="brand-wordmark text-xs tracking-[0.26em] text-muted-foreground">
                  Cotify
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {title ?? "Workspace"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher locale={locale} />
                <ThemeToggle />
              </div>
            </div>
            <div className="glass-panel hidden items-center justify-between gap-3 rounded-2xl px-5 py-4 lg:flex">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-primary/90 uppercase">
                  Fintech Operations Console
                </p>
                <p className="text-sm text-muted-foreground">
                  Full-width execution layer for subscriptions, products,
                  permissions and tenant-level controls.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-7 border-primary/30 bg-primary/10 text-primary"
                >
                  SLA 99.95%
                </Badge>
                <LanguageSwitcher locale={locale} />
                <ThemeToggle />
              </div>
            </div>
            {title || description || actions ? (
              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-1">
                  {title ? (
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                      {description}
                    </p>
                  ) : null}
                </div>
                {actions ? (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="glass-panel min-w-0 rounded-2xl p-4 ring-1 ring-primary/10 sm:p-5 lg:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
