"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PLANS, type PlanDefinition } from "@/lib/payments/plans";
import type { PaymentFormData } from "@/lib/payments/types";
import { useRouter } from "next/navigation";

interface EnhancedCheckoutFormProps {
  planCode: string;
  locale: string;
  onPay: (planCode: string, formData: PaymentFormData) => Promise<void>;
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

function formatCardNumber(value: string): string {
  return value
    .replace(/\s/g, "")
    .replace(/(\d{4})/g, "$1 ")
    .trim();
}

function formatCardExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
  }
  return cleaned;
}

export function EnhancedCheckoutForm({
  planCode,
  locale,
  onPay,
}: EnhancedCheckoutFormProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState<PaymentFormData>({
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    billingEmail: "",
    billingName: "",
    billingCountry: "",
  });

  const plan = PLANS.find((p) => p.code === planCode);

  if (!plan) {
    router.replace(`/${locale}/onboarding`);
    return null;
  }

  const { label: priceLabel, period } = getPriceDisplay(plan, t);
  const isEnterprise = plan.code === "enterprise";
  const isFree = plan.prices[0]?.amount === 0;

  const isFormValid =
    !isFree &&
    formData.cardName.trim().length > 0 &&
    formData.cardNumber.replace(/\s/g, "").length === 16 &&
    formData.cardExpiry.length === 5 &&
    formData.cardCvc.length === 3 &&
    formData.billingEmail.trim().length > 0 &&
    formData.billingName.trim().length > 0 &&
    formData.billingCountry.trim().length > 0;

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCardNumber(e.target.value.slice(0, 19));
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
  }

  function handleCardExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCardExpiry(e.target.value.slice(0, 5));
    setFormData((prev) => ({ ...prev, cardExpiry: formatted }));
  }

  function handleCardCvcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setFormData((prev) => ({ ...prev, cardCvc: value }));
  }

  async function handlePay() {
    if (!isFormValid && !isFree && !isEnterprise) return;

    setIsPending(true);
    try {
      await onPay(planCode, formData);
    } finally {
      setIsPending(false);
    }
  }

  if (isFree) {
    return (
      <div className="mx-auto grid w-full max-w-2xl gap-6">
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
                {t(
                  `planContent.${plan.code}.summary` as Parameters<typeof t>[0],
                )}
              </p>
            </div>

            <div className="flex items-baseline gap-2 border-t border-border/50 pt-4">
              <span className="text-xs font-medium text-muted-foreground">
                {t("checkout.priceLabel")}
              </span>
              <span className="ml-auto text-2xl font-semibold text-foreground">
                {priceLabel}
              </span>
            </div>

            <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              {t("checkout.simulatedNote")}
            </p>

            <div className="grid gap-2">
              <Button
                type="button"
                className="h-11 w-full"
                onClick={handlePay}
                disabled={isPending}
              >
                {t("checkout.payNow")}
              </Button>
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

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-3">
      {/* Plan Summary - Sticky on larger screens */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          <Card className="rounded-[1.35rem] border-border/70 shadow-none">
            <CardContent className="grid gap-4 p-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {t("checkout.planLabel")}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {getPlanName(plan, t)}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t(
                    `planContent.${plan.code}.summary` as Parameters<
                      typeof t
                    >[0],
                  )}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 border-t border-border/50 pt-4">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("checkout.priceLabel")}
                </span>
                <span className="ml-auto text-lg font-semibold text-foreground">
                  {priceLabel}
                </span>
                {period ? (
                  <span className="text-xs text-muted-foreground">
                    {period}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Form */}
      <div className="lg:col-span-2">
        <Card className="rounded-[1.35rem] border-border/70 shadow-none">
          <CardContent className="grid gap-6 p-6">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CreditCard className="size-4" />
                {t("checkout.cardDetailsLabel")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("checkout.cardDetailsDescription")}
              </p>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                {t("checkout.cardNameLabel")}
              </label>
              <Input
                type="text"
                placeholder={t("checkout.cardNamePlaceholder")}
                value={formData.cardName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cardName: e.target.value,
                  }))
                }
                disabled={isPending}
                className="rounded-lg border-border/70"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                {t("checkout.cardNumberLabel")}
              </label>
              <Input
                type="text"
                placeholder="4242 4242 4242 4242"
                value={formData.cardNumber}
                onChange={handleCardNumberChange}
                disabled={isPending}
                className="rounded-lg border-border/70 font-mono text-sm tracking-widest"
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                {t("checkout.testCardHint")}
              </p>
            </div>

            {/* Expiry and CVC */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  {t("checkout.cardExpiryLabel")}
                </label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={formData.cardExpiry}
                  onChange={handleCardExpiryChange}
                  disabled={isPending}
                  className="rounded-lg border-border/70 font-mono"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  {t("checkout.cardCvcLabel")}
                </label>
                <Input
                  type="text"
                  placeholder="123"
                  value={formData.cardCvc}
                  onChange={handleCardCvcChange}
                  disabled={isPending}
                  className="rounded-lg border-border/70 font-mono"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Billing Details */}
            <div className="space-y-1 border-t border-border/50 pt-4">
              <p className="text-sm font-semibold text-foreground">
                {t("checkout.billingDetailsLabel")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("checkout.billingDetailsDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                {t("checkout.billingNameLabel")}
              </label>
              <Input
                type="text"
                placeholder={t("checkout.billingNamePlaceholder")}
                value={formData.billingName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingName: e.target.value,
                  }))
                }
                disabled={isPending}
                className="rounded-lg border-border/70"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                {t("checkout.billingEmailLabel")}
              </label>
              <Input
                type="email"
                placeholder="contact@example.com"
                value={formData.billingEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingEmail: e.target.value,
                  }))
                }
                disabled={isPending}
                className="rounded-lg border-border/70"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                {t("checkout.billingCountryLabel")}
              </label>
              <Input
                type="text"
                placeholder="Country"
                value={formData.billingCountry}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingCountry: e.target.value,
                  }))
                }
                disabled={isPending}
                className="rounded-lg border-border/70"
              />
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("checkout.simulatedNote")}
              </p>
            </div>

            {/* Actions */}
            <div className="grid gap-2 border-t border-border/50 pt-4">
              <Button
                type="button"
                className="h-11 w-full"
                onClick={handlePay}
                disabled={!isFormValid || isPending}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("checkout.processing")}
                  </span>
                ) : (
                  t("checkout.payNow")
                )}
              </Button>
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
    </div>
  );
}
