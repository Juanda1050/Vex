import * as React from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";

type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

function AppShell({
  children,
  sidebar,
  title,
  description,
  actions,
}: AppShellProps) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto grid min-h-full max-w-7xl grid-cols-1 gap-4 p-4 md:gap-6 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:p-8">
        <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <Card className="border border-border bg-sidebar text-sidebar-foreground shadow-md">
            <div className="flex items-center justify-between gap-3 px-5 py-5">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold tracking-[0.24em] text-sidebar-foreground/70 uppercase">
                  Cotify
                </p>
                <h1 className="truncate text-lg font-semibold text-sidebar-foreground">
                  {title ?? "Workspace"}
                </h1>
                {description ? (
                  <p className="text-sm text-sidebar-foreground/70">
                    {description}
                  </p>
                ) : null}
              </div>
              <ThemeToggle />
            </div>
            {sidebar ? (
              <div className="border-t border-sidebar-border px-3 py-3">
                {sidebar}
              </div>
            ) : null}
          </Card>
        </aside>

        <main className="min-w-0">
          <div className="flex min-w-0 flex-col gap-4 md:gap-6">
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
                  <div className="flex shrink-0 items-center gap-2">
                    {actions}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
