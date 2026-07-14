"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
    <div className="mx-auto grid w-full max-w-5xl gap-7 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,22rem)] lg:items-start lg:gap-10">
      <div className="space-y-4 lg:space-y-5">
        <div className="space-y-4 text-center lg:text-left">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t("welcome.badge")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("welcome.title")}
          </h1>
          <p className="max-w-xl text-sm leading-7 text-foreground/80 sm:text-base">
            {t("welcome.description")}
          </p>
        </div>

        <div className="rounded-[1.1rem] border border-primary/25 bg-primary/5 px-6 py-4 text-center lg:text-left">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {t("welcome.planActivated")}
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {planName}
          </p>
        </div>
      </div>

      <div className="grid w-full gap-3 lg:sticky lg:top-7">
        <Button
          type="button"
          className="h-11 w-full"
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
          className="h-10 w-full text-muted-foreground"
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
  );
}
