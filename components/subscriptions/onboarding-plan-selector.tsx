"use client";

import { Check } from "lucide-react";

import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingPlanSelector } from "@/hooks/use-onboarding-plan-selector";
import type { SubscriptionPlanSummary } from "@/server/subscriptions";

interface OnboardingPlanSelectorProps {
  locale: string;
  plans: SubscriptionPlanSummary[];
  currentPlanCode?: string | null;
  canManageBilling: boolean;
}

export function OnboardingPlanSelector({
  locale,
  plans,
  currentPlanCode,
  canManageBilling,
}: OnboardingPlanSelectorProps) {
  const { t, planState, planAction, planPending, planCards } =
    useOnboardingPlanSelector({
      locale,
      plans,
      currentPlanCode,
    });

  return (
    <div className="grid gap-5">
      {planState.error ? (
        <p className="border-l-2 border-destructive/45 pl-3 text-sm text-destructive">
          {planState.error}
        </p>
      ) : null}

      {planState.success && planState.selectedPlanCode ? (
        <p className="border-l-2 border-success/45 pl-3 text-sm text-success">
          {t("planUpdated", { planCode: planState.selectedPlanCode })}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {planCards.map((plan) => {
          const planClass = plan.isCurrent
            ? "border-primary/45 bg-card shadow-[inset_0_1px_0_hsl(var(--primary)/0.32)]"
            : "border-border/70 bg-card";

          return (
            <Card
              key={plan.code}
              className={`h-full rounded-[1.35rem] shadow-none ${planClass}`}
            >
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </p>
                    {plan.isCurrent ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
                        {t("current")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-foreground">
                    {plan.priceLabel}
                    {plan.periodLabel ? (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        / {plan.periodLabel}
                      </span>
                    ) : null}
                  </p>
                  {plan.description ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {plan.description}
                    </p>
                  ) : null}
                </div>

                {plan.features.length > 0 ? (
                  <ul className="grid flex-1 auto-rows-min gap-2.5 overflow-auto pr-1 text-sm">
                    {plan.features.map((feature) => (
                      <li
                        key={`${plan.code}-${feature.key}`}
                        className="rounded-lg border border-border/65 bg-muted/35 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">
                              {feature.label}
                            </p>
                            {feature.description ? (
                              <p className="text-xs leading-5 text-muted-foreground">
                                {feature.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-full border border-border/70 bg-card px-2 py-0.5 text-xs font-semibold text-foreground">
                            {feature.value}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {plan.features.length === 0 ? (
                  <p className="flex-1 text-sm text-muted-foreground">
                    {t("noFeatures")}
                  </p>
                ) : null}

                <form action={planAction} className="mt-auto grid gap-2 pt-1">
                  <input type="hidden" name="planCode" value={plan.code} />
                  {plan.priceId ? (
                    <input type="hidden" name="priceId" value={plan.priceId} />
                  ) : null}
                  <LoadingSubmitButton
                    type="submit"
                    disabled={
                      planPending || !canManageBilling || plan.isCurrent
                    }
                    variant={plan.isCurrent ? "outline" : "default"}
                    className="h-11 w-full"
                  >
                    {plan.isCurrent ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="size-3.5" />
                        {t("selected")}
                      </span>
                    ) : (
                      t("choosePlan")
                    )}
                  </LoadingSubmitButton>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!canManageBilling ? (
        <p className="border-l-2 border-warning/45 pl-3 text-sm text-warning">
          {t("billingPermissionRequired")}
        </p>
      ) : null}
    </div>
  );
}
