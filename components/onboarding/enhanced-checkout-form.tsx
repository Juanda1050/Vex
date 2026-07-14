"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, Shield, WalletCards, X } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";

import { useEnhancedCheckoutForm } from "@/hooks/use-enhanced-checkout-form";
import { PLANS, type PlanDefinition } from "@/lib/payments/plans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import amexLogo from "@/assets/amex.svg";
import mastercardLogo from "@/assets/mastercard.svg";
import visaLogo from "@/assets/visa.svg";

interface EnhancedCheckoutFormProps {
  planCode: string;
  locale: string;
  onPay: (planCode: string, priceId?: string) => Promise<void>;
}

const CARD_BRAND_LOGOS: Record<
  "mastercard" | "amex" | "visa",
  { src: StaticImageData; alt: string }
> = {
  mastercard: { src: mastercardLogo, alt: "Mastercard" },
  amex: { src: amexLogo, alt: "American Express" },
  visa: { src: visaLogo, alt: "Visa" },
};

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
  const isFree = price?.amount === 0;

  if (isFree) return { label: t("checkout.free"), period: null };
  return {
    label: `$${price?.amount}`,
    period:
      price?.interval === "month"
        ? t("checkout.perMonth")
        : `/ ${price?.interval}`,
  };
}

function BrandLogo({
  brand,
  isActive,
}: {
  brand: "mastercard" | "amex" | "visa";
  isActive: boolean;
}) {
  const { src, alt } = CARD_BRAND_LOGOS[brand];

  const baseClass = cn(
    "inline-flex h-8 w-14 items-center justify-center transition",
    isActive ? "opacity-100" : "opacity-60",
  );

  return (
    <span className={baseClass}>
      <Image
        src={src}
        alt={alt}
        className="h-6 w-auto"
        width={44}
        height={24}
        aria-hidden="true"
      />
    </span>
  );
}

export function EnhancedCheckoutForm({
  planCode,
  locale,
  onPay,
}: EnhancedCheckoutFormProps) {
  const router = useRouter();

  const plan = PLANS.find((p) => p.code === planCode);

  if (!plan) {
    router.replace(`/${locale}/onboarding`);
    return null;
  }

  return (
    <EnhancedCheckoutFormContent plan={plan} locale={locale} onPay={onPay} />
  );
}

interface EnhancedCheckoutFormContentProps {
  plan: PlanDefinition;
  locale: string;
  onPay: (planCode: string, priceId?: string) => Promise<void>;
}

function EnhancedCheckoutFormContent({
  plan,
  locale,
  onPay,
}: EnhancedCheckoutFormContentProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const checkout = useEnhancedCheckoutForm({
    plan,
    locale,
    onPay,
  });

  const { label: fallbackPriceLabel } = getPriceDisplay(plan, t);
  const showCardFieldErrors = !checkout.isFree;

  const renderError = (message?: string) => {
    if (!message) return null;
    return <p className="text-xs text-destructive">{message}</p>;
  };

  const selectedOption = checkout.pricingOptions.find(
    (option) => option.interval === checkout.selectedInterval,
  );
  const cvcLength = checkout.cardBrand === "amex" ? 4 : 3;
  const visibleCardBrands: Array<"mastercard" | "amex" | "visa"> =
    checkout.cardBrand === "unknown"
      ? ["mastercard", "amex", "visa"]
      : [checkout.cardBrand];

  if (checkout.isFree) {
    return (
      <div className="w-full rounded-[1.6rem] border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4">
            <p className="text-sm font-semibold tracking-tight text-primary">
              {t("checkout.brand")}
            </p>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {t("checkout.freeFlow.title")}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("checkout.freeFlow.description")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">
                {t("checkout.freeFlow.capabilitiesTitle")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("checkout.freeFlow.capabilities.inventory.title")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("checkout.freeFlow.capabilities.inventory.description")}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("checkout.freeFlow.capabilities.sales.title")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("checkout.freeFlow.capabilities.sales.description")}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("checkout.freeFlow.capabilities.team.title")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("checkout.freeFlow.capabilities.team.description")}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("checkout.freeFlow.capabilities.upgrade.title")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("checkout.freeFlow.capabilities.upgrade.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
              <p className="text-sm font-semibold text-foreground">
                {t("checkout.freeFlow.nextStepTitle")}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("checkout.freeFlow.nextStepDescription")}
              </p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border/70 bg-background/70 p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t("checkout.planLabel")}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {getPlanName(plan, t)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(`planContent.${plan.code}.summary` as Parameters<typeof t>[0])}
            </p>

            <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
              <span className="text-xs text-muted-foreground">
                {t("checkout.priceLabel")}
              </span>
              <span className="text-3xl font-semibold text-foreground">
                {fallbackPriceLabel}
              </span>
            </div>

            <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {t("checkout.freeFlow.note")}
            </p>

            <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
              <p className="text-xs font-semibold tracking-[0.12em] text-foreground/80 uppercase">
                {t("checkout.freeFlow.launchChecklistTitle")}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>{t("checkout.freeFlow.launchChecklist.items.products")}</li>
                <li>
                  {t("checkout.freeFlow.launchChecklist.items.customers")}
                </li>
                <li>
                  {t("checkout.freeFlow.launchChecklist.items.firstSale")}
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                className="h-11 w-full"
                onClick={checkout.handleSubmit}
                disabled={checkout.isPending}
              >
                {t("checkout.freeFlow.cta")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-full text-muted-foreground"
                onClick={() => router.push(`/${locale}/onboarding`)}
                disabled={checkout.isPending}
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                {t("checkout.changePlan")}
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[1.6rem] border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <section className="space-y-6">
          <p className="text-sm font-semibold tracking-tight text-primary">
            {t("checkout.brand")}
          </p>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("checkout.cardHeaderTitle", { product: getPlanName(plan, t) })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("checkout.cardHeaderSubtitle")}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {t("checkout.billingIntervalLabel")}
            </p>
            <p className="text-base font-semibold text-foreground">
              {t("checkout.starterPlanLabel")}
            </p>
            {checkout.pricingOptions.map((option) => (
              <button
                key={option.interval}
                type="button"
                onClick={() => checkout.setSelectedInterval(option.interval)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  checkout.selectedInterval === option.interval
                    ? "border-primary ring-1 ring-primary"
                    : "border-border/80 hover:border-primary/60",
                )}
                disabled={checkout.isPending}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-base font-semibold text-foreground">
                      {option.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    {checkout.selectedInterval === option.interval ? (
                      <p className="text-xs font-medium text-primary">
                        {t("selected")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {option.priceLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {option.cadenceLabel}
                    </p>
                    {option.savingsLabel ? (
                      <p className="text-xs font-semibold text-primary">
                        {option.savingsLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {t("checkout.breakdown.title")}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("checkout.breakdown.plan")}</span>
                <span className="font-medium text-foreground">
                  {getPlanName(plan, t)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("checkout.breakdown.subtotal")}</span>
                <span className="font-medium text-foreground">
                  {selectedOption?.priceLabel ?? checkout.subtotalLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("checkout.breakdown.frequency")}</span>
                <span className="font-medium text-foreground">
                  {selectedOption?.cadenceLabel ?? checkout.totalCadence}
                </span>
              </div>
              {checkout.appliedPromoCode ? (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("checkout.breakdown.promoCode")}</span>
                  <span className="font-medium text-foreground">
                    {checkout.appliedPromoCode}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  {checkout.appliedPromoCode
                    ? t("checkout.breakdown.discountApplied")
                    : t("checkout.breakdown.discount")}
                </span>
                <span className="font-medium text-foreground">
                  {checkout.promoDiscountPercent > 0
                    ? `-${checkout.discountAmountLabel} (${checkout.promoDiscountPercent}%)`
                    : (selectedOption?.savingsLabel ??
                      t("checkout.breakdown.noDiscount"))}
                </span>
              </div>
            </div>
            <div className="mt-3 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {t("checkout.breakdown.totalNow")}
                </span>
                <span className="text-xl font-semibold text-foreground">
                  {checkout.totalLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {t("checkout.operationTitle")}
            </p>
            <div className="space-y-2">
              <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("checkout.operationItems.inventory.title")}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("checkout.operationItems.inventory.description")}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("checkout.operationItems.sales.title")}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("checkout.operationItems.sales.description")}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("checkout.operationItems.team.title")}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("checkout.operationItems.team.description")}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("checkout.footerCopy")}
          </p>
        </section>

        <section className="space-y-5 rounded-xl border border-border/70 bg-background/70 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/80 bg-muted/25 p-1">
            <button
              type="button"
              className={cn(
                "h-10 rounded-lg text-sm font-medium transition",
                checkout.paymentMode === "card"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              onClick={() => checkout.setPaymentMode("card")}
              disabled={checkout.isPending}
            >
              {t("checkout.payByCard")}
            </button>
            <button
              type="button"
              className={cn(
                "h-10 rounded-lg text-sm font-medium transition",
                "cursor-not-allowed text-muted-foreground/70",
              )}
              disabled
            >
              {t("checkout.payWithPaypalSoon")}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {t("checkout.paymentDetailLabel")}
            </p>
            <div className="flex min-h-11 items-center rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <p className="flex items-center gap-2 font-medium">
                <WalletCards className="size-4" />
                {t("checkout.creditCard")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("checkout.cardNameLabel")}
              </label>
              <Input
                type="text"
                placeholder={t("checkout.cardNamePlaceholder")}
                value={checkout.formData.cardName}
                onChange={(e) =>
                  checkout.setFieldValue("cardName", e.target.value)
                }
                onBlur={() => checkout.touchField("cardName")}
                disabled={checkout.isPending}
                className="h-11 rounded-lg border-border/70"
              />
              {showCardFieldErrors
                ? renderError(checkout.visibleErrors.cardName)
                : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("checkout.cardNumberLabel")}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={checkout.formData.cardNumber}
                  onChange={(e) =>
                    checkout.setFieldValue(
                      "cardNumber",
                      checkout.formatCardNumber(e.target.value),
                    )
                  }
                  onBlur={() => checkout.touchField("cardNumber")}
                  disabled={checkout.isPending}
                  className={cn(
                    "h-11 rounded-lg border-border/70 font-mono text-sm tracking-wider",
                    visibleCardBrands.length === 1 ? "pr-20" : "pr-52",
                  )}
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1.5">
                  {visibleCardBrands.map((brand) => (
                    <BrandLogo
                      key={brand}
                      brand={brand}
                      isActive={checkout.cardBrand === brand}
                    />
                  ))}
                </div>
              </div>
              {showCardFieldErrors
                ? renderError(checkout.visibleErrors.cardNumber)
                : null}
            </div>

            <div className="grid w-full max-w-76 grid-cols-[11rem_7rem] gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("checkout.cardExpiryLabel")}
                </label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={checkout.formData.cardExpiry}
                  onChange={(e) =>
                    checkout.setFieldValue(
                      "cardExpiry",
                      checkout.formatCardExpiry(e.target.value),
                    )
                  }
                  onBlur={() => checkout.touchField("cardExpiry")}
                  disabled={checkout.isPending}
                  className="h-11 w-full rounded-lg border-border/70 font-mono"
                />
                {showCardFieldErrors
                  ? renderError(checkout.visibleErrors.cardExpiry)
                  : null}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("checkout.cardCvcLabel")}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={cvcLength === 4 ? "1234" : "123"}
                  value={checkout.formData.cardCvc}
                  onChange={(e) =>
                    checkout.setFieldValue(
                      "cardCvc",
                      checkout.formatCardCvc(e.target.value),
                    )
                  }
                  onBlur={() => checkout.touchField("cardCvc")}
                  disabled={checkout.isPending}
                  maxLength={cvcLength}
                  className="h-11 w-full rounded-lg border-border/70 font-mono"
                />
                {showCardFieldErrors
                  ? renderError(checkout.visibleErrors.cardCvc)
                  : null}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {t("checkout.promo.title")}
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={t("checkout.promo.placeholder")}
                  value={checkout.promoCodeInput}
                  onChange={(e) => checkout.setPromoCodeInput(e.target.value)}
                  disabled={
                    checkout.isPending || checkout.promoState === "validating"
                  }
                  className="h-11 rounded-lg border-border/70"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11"
                  onClick={checkout.applyPromoCode}
                  disabled={
                    checkout.isPending || checkout.promoState === "validating"
                  }
                >
                  {checkout.promoState === "validating"
                    ? t("checkout.promo.applying")
                    : t("checkout.promo.apply")}
                </Button>
              </div>
              {checkout.promoMessage ? (
                <p
                  className={cn(
                    "text-xs",
                    checkout.promoState === "applied"
                      ? "text-primary"
                      : checkout.promoState === "removed"
                        ? "text-muted-foreground"
                        : "text-destructive",
                  )}
                >
                  {checkout.promoMessage}
                </p>
              ) : null}
              {checkout.appliedPromoCode ? (
                <div className="pt-1">
                  <Badge variant="outline" className="h-7 gap-1.5 px-2.5">
                    <span className="font-semibold">
                      {checkout.appliedPromoCode}
                    </span>
                    <button
                      type="button"
                      onClick={checkout.removePromoCode}
                      className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label={t("checkout.promo.remove")}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("checkout.billingCountryLabel")}
                </label>
                <Input
                  type="text"
                  placeholder={t("checkout.billingCountryPlaceholder")}
                  value={checkout.formData.billingCountry}
                  onChange={(e) =>
                    checkout.setFieldValue("billingCountry", e.target.value)
                  }
                  onBlur={() => checkout.touchField("billingCountry")}
                  disabled={checkout.isPending}
                  className="h-11 rounded-lg border-border/70"
                />
                {showCardFieldErrors
                  ? renderError(checkout.visibleErrors.billingCountry)
                  : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("checkout.postalCodeLabel")}
                </label>
                <Input
                  type="text"
                  placeholder={t("checkout.postalCodePlaceholder")}
                  value={checkout.formData.billingPostalCode}
                  onChange={(e) =>
                    checkout.setFieldValue("billingPostalCode", e.target.value)
                  }
                  onBlur={() => checkout.touchField("billingPostalCode")}
                  disabled={checkout.isPending}
                  className="h-11 rounded-lg border-border/70"
                />
                {showCardFieldErrors
                  ? renderError(checkout.visibleErrors.billingPostalCode)
                  : null}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-baseline justify-between">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {t("checkout.priceLabel")}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {checkout.totalLabel}
                {checkout.totalCadence ? (
                  <span className="ml-1 text-base font-medium text-muted-foreground">
                    {checkout.totalCadence}
                  </span>
                ) : null}
              </p>
            </div>

            <Button
              type="button"
              className="h-11 w-full"
              onClick={checkout.handleSubmit}
              disabled={checkout.isPending || !checkout.isFormValid}
            >
              {checkout.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("checkout.processing")}
                </span>
              ) : (
                t("checkout.subscribe")
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full text-muted-foreground"
              onClick={() => router.push(`/${locale}/onboarding`)}
              disabled={checkout.isPending}
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              {t("checkout.changePlan")}
            </Button>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="mt-0.5 size-3.5 shrink-0" />
              <span>{t("checkout.secureExtendedNote")}</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
