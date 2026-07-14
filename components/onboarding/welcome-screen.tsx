"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Sparkles } from "lucide-react";

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
    <div className="mx-auto w-full max-w-3xl py-4">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-border/60 bg-linear-to-br from-card via-card to-muted/40 p-5 shadow-xl shadow-primary/10 sm:p-7">
        <div className="pointer-events-none absolute -top-16 -right-20 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-3 text-center sm:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase backdrop-blur-sm">
              <CheckCircle2 className="size-3.5" />
              {t("welcome.badge")}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
              {t("welcome.title")}
            </h1>
            <p className="text-sm leading-7 text-foreground/80 sm:max-w-2xl sm:text-base">
              {t("welcome.description")}
            </p>
          </div>

          <div className="rounded-[1rem] border border-primary/20 bg-background/75 px-5 py-4 text-center backdrop-blur-sm sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Sparkles className="size-4 text-primary" />
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t("welcome.planActivated")}
              </p>
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
              {planName}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button
              type="button"
              className="h-11 w-full font-medium"
              onClick={() =>
                router.push(`/${locale}/onboarding/tutorial?plan=${planCode}`)
              }
              disabled={isSkipping}
            >
              {t("welcome.startTutorial")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full border border-border/60 bg-background/60 text-muted-foreground hover:bg-background"
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
          </div>
        </div>
      </div>
    </div>
  );
}
