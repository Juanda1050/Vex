"use client";

import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Package,
  Users,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingTutorialStepper } from "@/hooks/use-onboarding-tutorial-stepper";
import {
  STEP_EXAMPLES,
  STEP_KEYS,
  type StepKey,
} from "@/lib/onboarding/tutorial-steps";

const STEP_ICONS: Record<StepKey, React.ElementType> = {
  dashboard: LayoutDashboard,
  products: Package,
  customers: Users,
  quotes: FileText,
};

interface TutorialStepperProps {
  onFinish: () => Promise<void>;
}

export function TutorialStepper({ onFinish }: TutorialStepperProps) {
  const t = useTranslations("onboarding.tutorial");

  const total = STEP_KEYS.length;
  const { currentIndex, isFinishing, isLast, goPrev, goNext, goTo, finish } =
    useOnboardingTutorialStepper({ total, onFinish });
  const stepKey = STEP_KEYS[currentIndex] as StepKey;
  const Icon = STEP_ICONS[stepKey];
  const example = STEP_EXAMPLES[stepKey];

  return (
    <div className="grid w-full gap-6 motion-safe:animate-[tutorial-fade-up_480ms_cubic-bezier(0.22,1,0.36,1)_both]">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEP_KEYS.map((key, idx) => (
          <div
            key={key}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              idx <= currentIndex
                ? "bg-linear-to-r from-primary via-info to-primary"
                : "bg-border/60"
            } ${
              idx === currentIndex
                ? "motion-safe:animate-[tutorial-progress-glow_2.8s_ease-in-out_infinite]"
                : ""
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("step", { current: currentIndex + 1, total })}
        </p>
        <p className="text-xs text-muted-foreground">
          {currentIndex + 1}/{total}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {STEP_KEYS.map((key, idx) => {
          const isActive = idx === currentIndex;
          const StepIcon = STEP_ICONS[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => goTo(idx)}
              disabled={isFinishing}
              className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition-all duration-250 ${
                isActive
                  ? "border-primary/45 bg-linear-to-br from-primary/14 via-info/8 to-card text-foreground shadow-sm"
                  : "border-border/65 bg-card text-muted-foreground hover:border-border hover:bg-muted/35 hover:text-foreground dark:text-foreground/70"
              } focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <StepIcon className="size-3.5 shrink-0" strokeWidth={1.85} />
              <span className="truncate font-medium">
                {t(`steps.${key}.title` as Parameters<typeof t>[0])}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step card */}
      <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/95 shadow-md ring-1 ring-black/5">
        <CardContent className="grid min-h-80 gap-6 p-5 sm:p-7 lg:min-h-96 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <div
            key={`content-${stepKey}`}
            className="flex min-w-0 flex-col gap-5 motion-safe:animate-[tutorial-fade-up_320ms_cubic-bezier(0.22,1,0.36,1)_both]"
          >
            <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
              <Icon className="size-5 text-foreground/70" strokeWidth={1.75} />
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.55rem]">
                {t(`steps.${stepKey}.title` as Parameters<typeof t>[0])}
              </h2>
              <p className="max-w-prose text-sm leading-7 text-muted-foreground xl:text-[1.02rem]">
                {t(`steps.${stepKey}.description` as Parameters<typeof t>[0])}
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-full border border-info/30 bg-info/10 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-info uppercase">
              {t("preview.badge")}
            </div>

            {/* Navigation anchored to the bottom to keep card height stable across steps. */}
            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                className="h-10 text-muted-foreground dark:text-foreground/72"
                onClick={goPrev}
                disabled={currentIndex === 0 || isFinishing}
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                {t("back")}
              </Button>

              {isLast ? (
                <Button
                  type="button"
                  className="h-11 min-w-40"
                  onClick={finish}
                  disabled={isFinishing}
                >
                  {isFinishing ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t("finish")}
                    </span>
                  ) : (
                    t("finish")
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 min-w-40"
                  onClick={goNext}
                >
                  {t("next")}
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div
            key={`preview-${stepKey}`}
            className="rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-muted/35 p-4 sm:p-5 motion-safe:animate-[tutorial-fade-up_400ms_cubic-bezier(0.22,1,0.36,1)_both]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
              <p className="font-heading text-sm font-semibold tracking-wide text-foreground/95">
                {t(example.sectionKey as Parameters<typeof t>[0])}
              </p>
              <span className="rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t("preview.demo")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {example.metrics.map((metric, idx) => (
                <div
                  key={`${stepKey}-${metric.labelKey}-${idx}`}
                  className="rounded-xl border border-border/70 bg-card px-2.5 py-2 transition-transform duration-250 hover:-translate-y-0.5"
                >
                  <p className="text-[11px] text-muted-foreground">
                    {t(metric.labelKey as Parameters<typeof t>[0])}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {metric.value}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${metric.accent}`}
                  >
                    {t("preview.live")}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              {example.rows.map((row) => (
                <div
                  key={row.titleKey}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 transition-colors duration-250 hover:bg-muted/25"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {t(row.titleKey as Parameters<typeof t>[0])}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(row.subtitleKey as Parameters<typeof t>[0])}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {row.amount}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t(row.statusKey as Parameters<typeof t>[0])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
