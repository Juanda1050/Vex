"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/payments/plans";

interface WelcomeScreenProps {
  planCode: string;
  locale: string;
  onSkip: () => Promise<void>;
}

export function WelcomeScreen({
  planCode,
  locale,
  onSkip,
}: WelcomeScreenProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [isSkipping, startTransition] = useTransition();

  const plan = PLANS.find((p) => p.code === planCode);
  const planName = plan
    ? t(`planContent.${plan.code}.name` as Parameters<typeof t>[0])
    : planCode;

  function handleSkip() {
    startTransition(async () => {
      await onSkip();
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl py-4">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-border/60 bg-linear-to-br from-card via-card to-muted/35 p-5 shadow-lg sm:p-7">
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-muted/60 blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-3 text-center sm:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase backdrop-blur-sm">
              <CheckCircle2 className="size-3.5" />
              {t("welcome.badge")}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem] xl:text-[2.5rem]">
              {t("welcome.title")}
            </h1>
            <p className="text-sm leading-7 text-foreground/80 dark:text-foreground/86 sm:max-w-2xl sm:text-base xl:max-w-3xl xl:text-[1.05rem]">
              {t("welcome.description")}
            </p>
          </div>

          <div className="rounded-[1rem] border border-border/60 bg-background/75 px-5 py-4 text-center backdrop-blur-sm sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Sparkles className="size-4 text-muted-foreground" />
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase dark:text-foreground/70">
                {t("welcome.planActivated")}
              </p>
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
              {planName}
            </p>
          </div>

          <div className="grid w-full gap-3 col-auto sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-center px-3 text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 dark:text-foreground/72 dark:hover:text-foreground sm:w-auto sm:justify-start"
              onClick={handleSkip}
              disabled={isSkipping}
            >
              {isSkipping ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("welcome.skipTutorial")}
                </span>
              ) : (
                t("welcome.skipTutorial")
              )}
            </Button>

            <Button
              type="button"
              className="h-11 w-full font-medium focus-visible:ring-3 focus-visible:ring-ring/30 sm:w-auto sm:min-w-56"
              onClick={() =>
                router.push(`/${locale}/onboarding/tutorial?plan=${planCode}`)
              }
              disabled={isSkipping}
            >
              <span className="inline-flex items-center gap-2">
                {t("welcome.startTutorial")}
                <ArrowRight className="size-4" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
