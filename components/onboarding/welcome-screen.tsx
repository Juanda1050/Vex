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
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-4 text-center">
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {t("welcome.badge")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("welcome.title")}
        </h1>
        <p className="max-w-lg text-sm leading-7 text-foreground/80 sm:text-base">
          {t("welcome.description")}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-1.5 rounded-[1.1rem] border border-primary/25 bg-primary/5 px-6 py-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {t("welcome.planActivated")}
        </p>
        <p className="text-xl font-semibold text-foreground">{planName}</p>
      </div>

      <div className="grid w-full max-w-xs gap-3">
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
