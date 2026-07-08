import Link from "next/link";
import type { ReactNode } from "react";

type AuthModulePanelProps = {
  icon: ReactNode;
  title: string;
  appTypeTitle: string;
  description: string;
  footerText: string;
  footerActionLabel: string;
  footerHref: string;
  children: ReactNode;
};

export function AuthModulePanel({
  icon,
  title,
  appTypeTitle,
  description,
  footerText,
  footerActionLabel,
  footerHref,
  children,
}: AuthModulePanelProps) {
  return (
    <div className="glass-panel glass-glow flex h-full min-h-0 flex-col justify-center rounded-[1.3rem] border border-border/60 p-4 sm:rounded-[1.5rem] sm:p-6 lg:rounded-[1.6rem] lg:p-7 xl:p-8">
      <div className="mx-auto w-full max-w-lg xl:max-w-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex size-8 items-center justify-center rounded-xl border border-border/70 bg-background/55">
              {icon}
            </div>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
          </div>
          <p className="pt-2 text-xs font-semibold tracking-[0.18em] text-foreground/70 uppercase">
            {appTypeTitle}
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>

        <div className="mt-5 sm:mt-6">{children}</div>

        <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-6">
          {footerText}{" "}
          <Link
            href={footerHref}
            className="font-medium text-primary hover:underline"
          >
            {footerActionLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
