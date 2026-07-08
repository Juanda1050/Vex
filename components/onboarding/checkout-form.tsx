"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";
import { PLANS, type PlanDefinition } from "@/lib/payments/plans";

interface CheckoutFormProps {
  planCode: string;
  locale: string;
  /**
   * Called when the user confirms the payment.
   * The parent server action or route handler resolves this.
   */
  onPay: (planCode: string) => Promise<void>;
}

function getPlanName(
  plan: PlanDefinition,
  t: ReturnType<typeof useTranslations>,
): string {
  return t(`planContent.${plan.code}.name` as Parameters<typeof t>[0]);
}

function getPriceDisplay(
  plan: PlanDefinition,
  t: ReturnType<typeof useTranslations>,
): { label: string; period: string | null } {
  const price = plan.prices[0];
  const isEnterprise = plan.code === "enterprise";
  const isFree = price?.amount === 0;

  if (isEnterprise) return { label: t("checkout.customPricing"), period: null };
  if (isFree) return { label: t("checkout.free"), period: null };
  return {
    label: `$${price?.amount}`,
    period:
      price?.interval === "month"
        ? t("checkout.perMonth")
        : `/ ${price?.interval}`,
  };
}

export function CheckoutForm({ planCode, locale, onPay }: CheckoutFormProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const plan = PLANS.find((p) => p.code === planCode);

  if (!plan) {
    router.replace(`/${locale}/onboarding`);
    return null;
  }

  const { label: priceLabel, period } = getPriceDisplay(plan, t);
  const isEnterprise = plan.code === "enterprise";

  function handlePay() {
    startTransition(async () => {
      await onPay(planCode);
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <Card className="rounded-[1.35rem] border-border/70 shadow-none">
        <CardContent className="grid gap-5 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {t("checkout.planLabel")}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {getPlanName(plan, t)}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t(`planContent.${plan.code}.summary` as Parameters<typeof t>[0])}
            </p>
          </div>

          <div className="flex items-baseline gap-2 border-t border-border/50 pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {t("checkout.priceLabel")}
            </span>
            <span className="ml-auto text-2xl font-semibold text-foreground">
              {priceLabel}
            </span>
            {period ? (
              <span className="text-sm text-muted-foreground">{period}</span>
            ) : null}
          </div>

          <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            {t("checkout.simulatedNote")}
          </p>

          <div className="grid gap-2">
            {isEnterprise ? (
              <Button
                type="button"
                className="h-11 w-full"
                onClick={handlePay}
                disabled={isPending}
              >
                {t("checkout.contactSales")}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 w-full"
                onClick={handlePay}
                disabled={isPending}
              >
                {isPending ? null : t("checkout.payNow")}
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("checkout.payNow")}
                  </span>
                ) : null}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full text-muted-foreground"
              onClick={() => router.push(`/${locale}/onboarding`)}
              disabled={isPending}
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              {t("checkout.changePlan")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
