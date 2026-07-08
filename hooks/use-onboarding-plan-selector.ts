"use client";

import { useActionState, useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  selectOnboardingPlanAction,
  type OnboardingActionResult,
} from "@/app/actions/onboarding";
import type { SubscriptionPlanSummary } from "@/server/subscriptions";

type UseOnboardingPlanSelectorInput = {
  locale: string;
  plans: SubscriptionPlanSummary[];
  currentPlanCode?: string | null;
};

type PlanFeature = {
  key: string;
  label: string;
  value: string;
  description?: string;
};

type PlanViewModel = {
  code: string;
  name: string;
  description?: string | null;
  isCurrent: boolean;
  priceLabel: string;
  periodLabel: string | null;
  priceId: string | null;
  features: PlanFeature[];
};

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

function formatFeatureValue(
  value: unknown,
  t: ReturnType<typeof useTranslations>,
  featureKey: string,
) {
  if (value === null) return t("features.unlimited");
  if (typeof value === "boolean")
    return value ? t("features.yes") : t("features.no");
  if (typeof value === "string") {
    const valueKey = `planFeatures.${featureKey}.values.${value}`;
    if (t.has(valueKey)) {
      return t(valueKey);
    }
  }
  return String(value);
}

function formatIntervalLabel(
  interval: string,
  t: ReturnType<typeof useTranslations>,
) {
  const key = `intervals.${interval.toLowerCase()}`;
  return t.has(key) ? t(key) : interval.toLowerCase();
}

export function useOnboardingPlanSelector({
  plans,
  currentPlanCode,
}: UseOnboardingPlanSelectorInput) {
  const t = useTranslations("onboarding");

  const [planState, planAction, planPending] = useActionState(
    selectOnboardingPlanAction,
    initialState,
  );

  const effectiveCurrentPlanCode =
    planState.success && planState.selectedPlanCode
      ? planState.selectedPlanCode
      : currentPlanCode;

  const planCards = useMemo<PlanViewModel[]>(() => {
    return plans.map((plan) => {
      const isCurrent = effectiveCurrentPlanCode === plan.code;
      const monthlyPrice =
        plan.prices.find((price) => price.interval === "MONTH") ??
        plan.prices[0] ??
        null;

      const features = Object.entries(plan.features ?? {}).map(
        ([key, value]) => ({
          key,
          label: t.has(`planFeatures.${key}.label`)
            ? t(`planFeatures.${key}.label`)
            : formatFeatureLabel(key),
          value: formatFeatureValue(value, t, key),
          description: t.has(`planFeatures.${key}.description`)
            ? t(`planFeatures.${key}.description`)
            : undefined,
        }),
      );

      const planSummaryKey = `planContent.${plan.code.toLowerCase()}.summary`;

      return {
        code: plan.code,
        name: plan.name,
        description: t.has(planSummaryKey)
          ? t(planSummaryKey)
          : plan.description,
        isCurrent,
        priceLabel: monthlyPrice
          ? `${monthlyPrice.amount} ${monthlyPrice.currency}`
          : t("customPricing"),
        periodLabel: monthlyPrice
          ? formatIntervalLabel(monthlyPrice.interval, t)
          : null,
        priceId: monthlyPrice?.id ?? null,
        features,
      };
    });
  }, [plans, effectiveCurrentPlanCode, t]);

  return {
    t,
    planState,
    planAction,
    planPending,
    planCards,
  };
}
