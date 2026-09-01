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

const FEATURE_DISPLAY_ORDER = ["pos.enabled"];

function getPosFeatureValue(plan: SubscriptionPlanSummary): boolean {
  const raw = (plan.features ?? {})["pos.enabled"];

  if (typeof raw === "boolean") return raw;

  return plan.code.toUpperCase() !== "FREE";
}

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

function formatFeatureLabel(
  key: string,
  t: ReturnType<typeof useTranslations>,
) {
  const translationKey = `subscriptions.planFeatures.${key}.label`;

  if (t.has(translationKey)) {
    return t(translationKey);
  }

  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\./g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

export function SettingsPlanComparison({
  plans,
  currentPlanCode,
  canManageBilling,
  usage,
}: SettingsPlanComparisonProps) {
  const t = useTranslations("settings");

  const actionWrapper = async (
    _prevState: SubscriptionActionResult,
    formData: FormData,
  ): Promise<SubscriptionActionResult> => {
    return changeSubscriptionPlanAction(formData);
  };

  const [state, action, pending] = useActionState(actionWrapper, initialState);

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
                  <li className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">
                          {formatFeatureLabel("pos.enabled", t)}
                        </p>
                        {t.has(
                          "subscriptions.planFeatures.pos.enabled.description",
                        ) ? (
                          <p className="text-xs leading-5 text-muted-foreground">
                            {t(
                              "subscriptions.planFeatures.pos.enabled.description",
                            )}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full border border-border/70 bg-card px-2 py-0.5 text-xs font-semibold text-foreground">
                        {getPosFeatureValue(plan)
                          ? t("subscriptions.features.yes")
                          : t("subscriptions.features.no")}
                      </span>
                    </div>
                  </li>

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

                  {Object.keys(plan.features ?? {})
                    .filter(
                      (key) =>
                        !METRIC_MAP.some((item) => item.key === key) &&
                        !FEATURE_DISPLAY_ORDER.includes(key),
                    )
                    .map((key) => {
                      const value = (plan.features ?? {})[key];
                      const label = formatFeatureLabel(key, t);
                      const descriptionKey = `subscriptions.planFeatures.${key}.description`;

                      return (
                        <li
                          key={`${plan.code}-${key}`}
                          className="rounded-lg border border-border/60 bg-background px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">
                                {label}
                              </p>
                              {t.has(descriptionKey) ? (
                                <p className="text-xs leading-5 text-muted-foreground">
                                  {t(descriptionKey)}
                                </p>
                              ) : null}
                            </div>
                            <span className="shrink-0 rounded-full border border-border/70 bg-card px-2 py-0.5 text-xs font-semibold text-foreground">
                              {typeof value === "boolean"
                                ? value
                                  ? t("subscriptions.features.yes")
                                  : t("subscriptions.features.no")
                                : value === null
                                  ? t("subscriptions.features.unlimited")
                                  : String(value)}
                            </span>
                          </div>
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
