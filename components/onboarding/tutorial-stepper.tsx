"use client";

import { useState } from "react";
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

const STEP_KEYS = ["dashboard", "products", "customers", "quotes"] as const;
type StepKey = (typeof STEP_KEYS)[number];

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const total = STEP_KEYS.length;
  const stepKey = STEP_KEYS[currentIndex] as StepKey;
  const Icon = STEP_ICONS[stepKey];
  const isLast = currentIndex === total - 1;

  async function handleFinish() {
    setIsFinishing(true);
    await onFinish();
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {STEP_KEYS.map((key, idx) => (
          <div
            key={key}
            className={`h-1 flex-1 rounded-full transition-colors ${
              idx <= currentIndex ? "bg-primary" : "bg-border/60"
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-semibold text-muted-foreground">
        {t("step", { current: currentIndex + 1, total })}
      </p>

      {/* Step card */}
      <Card className="rounded-[1.35rem] border-border/70 shadow-none">
        <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
            <Icon className="size-5 text-foreground/70" strokeWidth={1.75} />
          </div>
          <div className="space-y-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t(`steps.${stepKey}.title` as Parameters<typeof t>[0])}
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t(`steps.${stepKey}.description` as Parameters<typeof t>[0])}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          className="h-10 text-muted-foreground"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0 || isFinishing}
        >
          <ArrowLeft className="mr-1.5 size-3.5" />
          {t("back")}
        </Button>

        {isLast ? (
          <Button
            type="button"
            className="h-11 min-w-40"
            onClick={handleFinish}
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
            onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
          >
            {t("next")}
            <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
