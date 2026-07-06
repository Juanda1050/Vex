"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  changeSubscriptionPlanAction,
  type SubscriptionActionResult,
} from "@/app/actions/subscriptions";
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

type UsageMetrics = {
  products: number;
  warehouses: number;
  users: number;
};

interface SettingsPlanComparisonProps {
  plans: SubscriptionPlanSummary[];
  currentPlanCode: string | null;
  canManageBilling: boolean;
  usage: UsageMetrics;
}

const initialState: SubscriptionActionResult = {
  success: false,
  error: null,
  errorKey: null,
  status: undefined,
};

const METRIC_MAP = [
  { key: "productsLimit", usageKey: "products" as const },
  { key: "warehousesLimit", usageKey: "warehouses" as const },
  { key: "usersLimit", usageKey: "users" as const },
];

function getLimit(plan: SubscriptionPlanSummary, key: string): number | null {
  const raw = (plan.features ?? {})[key];
  return typeof raw === "number" ? raw : raw === null ? null : null;
}

function formatLimit(
  limit: number | null,
  t: ReturnType<typeof useTranslations>,
) {
  return limit === null ? t("subscriptions.unlimited") : String(limit);
}

export function SettingsPlanComparison({
  plans,
  currentPlanCode,
  canManageBilling,
  usage,
}: SettingsPlanComparisonProps) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState(
    changeSubscriptionPlanAction,
    initialState,
  );

  const currentPlan =
    plans.find((plan) => plan.code === currentPlanCode) ?? null;

  return (
    <div className="space-y-5">
      {state.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {t("subscriptions.planChanged")}
        </p>
      ) : null}

      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>{t("subscriptions.usageTitle")}</CardTitle>
          <CardDescription>
            {t("subscriptions.usageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">
                    {t("subscriptions.metric")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("subscriptions.currentUsage")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("subscriptions.currentLimit")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("subscriptions.remaining")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {METRIC_MAP.map(({ key, usageKey }) => {
                  const used = usage[usageKey];
                  const currentLimit = currentPlan
                    ? getLimit(currentPlan, key)
                    : null;
                  const remaining =
                    currentLimit === null
                      ? null
                      : Math.max(currentLimit - used, 0);
                  const overLimit =
                    currentLimit !== null && used >= currentLimit;

                  return (
                    <tr
                      key={key}
                      className="border-b border-border/40 last:border-none"
                    >
                      <td className="px-3 py-3 font-medium text-foreground">
                        {t(`subscriptions.metrics.${usageKey}`)}
                      </td>
                      <td className="px-3 py-3 text-foreground">{used}</td>
                      <td className="px-3 py-3 text-foreground">
                        {formatLimit(currentLimit, t)}
                      </td>
                      <td className="px-3 py-3">
                        {remaining === null ? (
                          <span className="text-foreground">
                            {t("subscriptions.unlimited")}
                          </span>
                        ) : overLimit ? (
                          <Badge variant="warning">
                            {t("subscriptions.limitReached")}
                          </Badge>
                        ) : (
                          <span className="text-foreground">{remaining}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          const monthlyPrice =
            plan.prices.find((price) => price.interval === "MONTH") ??
            plan.prices[0] ??
            null;

          return (
            <Card key={plan.code} className="border-border/80 bg-card/95">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent ? (
                    <Badge variant="success">
                      {t("subscriptions.current")}
                    </Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <p className="text-2xl font-semibold text-foreground">
                  {monthlyPrice
                    ? `${monthlyPrice.amount} ${monthlyPrice.currency}`
                    : t("subscriptions.customPricing")}
                  {monthlyPrice ? (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / {monthlyPrice.interval.toLowerCase()}
                    </span>
                  ) : null}
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {METRIC_MAP.map(({ key, usageKey }) => {
                    const used = usage[usageKey];
                    const planLimit = getLimit(plan, key);
                    const fitsUsage = planLimit === null || used <= planLimit;

                    return (
                      <li
                        key={`${plan.code}-${key}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2"
                      >
                        <span>{t(`subscriptions.metrics.${usageKey}`)}</span>
                        <span className="font-medium text-foreground">
                          {used} / {formatLimit(planLimit, t)}
                          {!fitsUsage
                            ? ` (${t("subscriptions.wouldExceed")})`
                            : ""}
                        </span>
                      </li>
                    );
                  })}
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
                    {isCurrent
                      ? t("subscriptions.selected")
                      : t("subscriptions.changePlan")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!canManageBilling ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t("subscriptions.billingPermissionRequired")}
        </p>
      ) : null}
    </div>
  );
}
