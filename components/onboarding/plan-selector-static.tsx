"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, type PlanDefinition } from "@/lib/payments/plans";

interface OnboardingPlanSelectorStaticProps {
  locale: string;
}

function formatFeatureValue(
  key: string,
  value: string | number | boolean | null,
  t: ReturnType<typeof useTranslations>,
): string {
  if (value === null) return t("features.unlimited");
  if (typeof value === "boolean")
    return value ? t("features.yes") : t("features.no");
  if (typeof value === "string") {
    const valueKey = `planFeatures.${key}.values.${value}` as Parameters<
      ReturnType<typeof useTranslations>
    >[0];
    return t.has(valueKey) ? t(valueKey) : value;
  }
  return String(value);
}

function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: PlanDefinition;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("onboarding");

  const price = plan.prices[0];
  const isFree = price?.amount === 0;
  const isEnterprise = plan.code === "enterprise";

  const priceLabel = isEnterprise
    ? t("checkout.customPricing")
    : isFree
      ? t("checkout.free")
      : `$${price?.amount}`;

  const periodLabel =
    !isEnterprise && !isFree && price?.interval === "month"
      ? t("checkout.perMonth")
      : null;

  const containerClass = isSelected
    ? "border-primary/50 bg-card shadow-[inset_0_1px_0_hsl(var(--primary)/0.32)]"
    : plan.highlighted
      ? "border-primary/25 bg-card"
      : "border-border/70 bg-card";

  return (
    <Card
      className={`h-full rounded-[1.35rem] shadow-none transition-colors ${containerClass}`}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-foreground">
              {t(`planContent.${plan.code}.name` as Parameters<typeof t>[0])}
            </p>
            <div className="flex gap-2">
              {plan.highlighted && !isSelected ? (
                <span className="rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-info uppercase">
                  Popular
                </span>
              ) : null}
              {isSelected ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
                  {t("selected")}
                </span>
              ) : null}
            </div>
          </div>

          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {priceLabel}
            {periodLabel ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {periodLabel}
              </span>
            ) : null}
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            {t(`planContent.${plan.code}.summary` as Parameters<typeof t>[0])}
          </p>
        </div>

        <ul className="grid flex-1 auto-rows-min gap-2.5 overflow-auto pr-1 text-sm">
          {plan.features.map((feature) => (
            <li
              key={feature.key}
              className="rounded-lg border border-border/65 bg-muted/35 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    {t(
                      `planFeatures.${feature.key}.label` as Parameters<
                        typeof t
                      >[0],
                    )}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-border/70 bg-card px-2 py-0.5 text-xs font-semibold text-foreground">
                  {formatFeatureValue(feature.key, feature.value, t)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-1">
          <Button
            type="button"
            onClick={onSelect}
            disabled={isSelected}
            variant={isSelected ? "outline" : "default"}
            className="h-11 w-full"
          >
            {isSelected ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" />
                {t("selected")}
              </span>
            ) : (
              t("selectPlan")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function OnboardingPlanSelectorStatic({
  locale,
}: OnboardingPlanSelectorStaticProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  function handleSelect(planCode: string) {
    setSelectedCode(planCode);
    router.push(`/${locale}/onboarding/checkout?plan=${planCode}`);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            isSelected={selectedCode === plan.code}
            onSelect={() => handleSelect(plan.code)}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {t("plans.descriptionCompact")}
      </p>
    </div>
  );
}
