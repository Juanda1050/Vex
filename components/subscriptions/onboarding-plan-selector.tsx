"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  selectOnboardingPlanAction,
  type OnboardingActionResult,
} from "@/app/actions/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubscriptionPlanSummary } from "@/server/subscriptions";

interface OnboardingPlanSelectorProps {
  plans: SubscriptionPlanSummary[];
  currentPlanCode?: string | null;
  canManageBilling: boolean;
}

const initialState: OnboardingActionResult = {
  success: false,
  error: null,
  errorKey: null,
  status: undefined,
  selectedPlanCode: null,
};

function formatFeatureLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatFeatureValue(value: unknown) {
  if (value === null) return "Unlimited";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function OnboardingPlanSelector({
  plans,
  currentPlanCode,
  canManageBilling,
}: OnboardingPlanSelectorProps) {
  const t = useTranslations("mvp.onboarding");
  const [state, action, pending] = useActionState(
    selectOnboardingPlanAction,
    initialState,
  );

  return (
    <div className="grid gap-4">
      {state.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.success && state.selectedPlanCode ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {t("planUpdated", { planCode: state.selectedPlanCode })}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanCode === plan.code;
          const features = Object.entries(plan.features ?? {});
          const monthlyPrice =
            plan.prices.find((price) => price.interval === "MONTH") ??
            plan.prices[0] ??
            null;

          return (
            <Card
              key={plan.code}
              className="border-border/80 bg-card/95 shadow-[0_10px_30px_hsl(var(--foreground)/0.06)]"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent ? (
                    <Badge variant="success">{t("current")}</Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <p className="text-2xl font-semibold text-foreground">
                  {monthlyPrice
                    ? `${monthlyPrice.amount} ${monthlyPrice.currency}`
                    : t("customPricing")}
                  {monthlyPrice ? (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / {monthlyPrice.interval.toLowerCase()}
                    </span>
                  ) : null}
                </p>
              </CardHeader>

              <CardContent className="grid gap-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {features.length > 0 ? (
                    features.map(([key, value]) => (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2"
                      >
                        <span>{formatFeatureLabel(key)}</span>
                        <span className="font-medium text-foreground">
                          {formatFeatureValue(value)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-lg border border-border/60 bg-background px-3 py-2">
                      {t("noFeatures")}
                    </li>
                  )}
                </ul>

                <form action={action} className="grid gap-2">
                  <input type="hidden" name="planCode" value={plan.code} />
                  {monthlyPrice ? (
                    <input
                      type="hidden"
                      name="priceId"
                      value={monthlyPrice.id}
                    />
                  ) : null}
                  <Button
                    type="submit"
                    disabled={pending || !canManageBilling || isCurrent}
                    variant={isCurrent ? "outline" : "default"}
                    className="w-full"
                  >
                    {isCurrent ? t("selected") : t("choosePlan")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!canManageBilling ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t("billingPermissionRequired")}
        </p>
      ) : null}
    </div>
  );
}
