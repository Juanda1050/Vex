"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type {
  PlanDefinition,
  PlanInterval,
  PlanPrice,
} from "@/lib/payments/plans";
import type { PaymentFormData } from "@/lib/payments/types";

type PaymentMode = "card" | "paypal";
type CheckoutField = keyof PaymentFormData;
type FieldErrorMap = Partial<Record<CheckoutField, string>>;
type CardBrand = "visa" | "mastercard" | "amex" | "unknown";
type PromoValidationState =
  "idle" | "validating" | "applied" | "error" | "removed";

interface UseEnhancedCheckoutFormInput {
  plan: PlanDefinition;
  locale: string;
  onPay: (planCode: string, priceId?: string) => Promise<void>;
}

interface PricingOption {
  interval: PlanInterval;
  title: string;
  description: string;
  priceLabel: string;
  cadenceLabel: string;
  savingsLabel: string | null;
}

interface PromoCodeResponse {
  ok: boolean;
  code?: string;
  discountPercent?: number;
  applicableInterval?: PlanInterval | null;
  error?:
    | "INVALID_CODE"
    | "EXPIRED_CODE"
    | "ALREADY_APPLIED"
    | "INTERVAL_NOT_ALLOWED";
}

const INITIAL_FORM_DATA: PaymentFormData = {
  cardName: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
  billingCountry: "",
  billingPostalCode: "",
};

function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.startsWith("4")) return "visa";

  const firstTwo = Number(digits.slice(0, 2));
  if (firstTwo >= 51 && firstTwo <= 55) return "mastercard";

  const firstFour = Number(digits.slice(0, 4));
  if (firstFour >= 2221 && firstFour <= 2720) return "mastercard";

  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";

  return "unknown";
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const maxLength = brand === "amex" ? 15 : 16;
  const sliced = digits.slice(0, maxLength);

  if (brand === "amex") {
    const part1 = sliced.slice(0, 4);
    const part2 = sliced.slice(4, 10);
    const part3 = sliced.slice(10, 15);

    return [part1, part2, part3].filter(Boolean).join(" ");
  }

  return sliced.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatCardExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (!cleaned) return "";

  if (cleaned.length <= 2) {
    if (cleaned.length === 2) {
      const monthValue = Number(cleaned);
      if (!Number.isNaN(monthValue)) {
        const safeMonth = Math.min(12, Math.max(1, monthValue));
        return String(safeMonth).padStart(2, "0");
      }
    }
    return cleaned;
  }

  const monthValue = Number(cleaned.slice(0, 2));
  const safeMonth = Number.isNaN(monthValue)
    ? 1
    : Math.min(12, Math.max(1, monthValue));

  const now = new Date();
  const currentYear = now.getFullYear() % 100;

  const yearRaw = cleaned.slice(2);
  let safeYear = yearRaw;
  if (yearRaw.length === 2) {
    const yearValue = Number(yearRaw);
    if (!Number.isNaN(yearValue) && yearValue < currentYear) {
      safeYear = String(currentYear).padStart(2, "0");
    }
  }

  return `${String(safeMonth).padStart(2, "0")}/${safeYear}`;
}

function formatCardCvc(value: string, cardBrand: CardBrand): string {
  const maxLength = cardBrand === "amex" ? 4 : 3;
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    const char = digits[i];
    if (!char) return false;

    let digit = Number(char);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return digits.length >= 13 && sum % 10 === 0;
}

function isValidExpiry(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);

  if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

function getMonthlyAndYearlyPrices(prices: PlanPrice[]) {
  const monthly = prices.find((price) => price.interval === "month") ?? null;
  const yearly = prices.find((price) => price.interval === "year") ?? null;

  return { monthly, yearly };
}

export function useEnhancedCheckoutForm({
  plan,
  locale,
  onPay,
}: UseEnhancedCheckoutFormInput) {
  const t = useTranslations("onboarding");
  const [isPending, setIsPending] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("card");
  const [formData, setFormData] = useState<PaymentFormData>(INITIAL_FORM_DATA);
  const [touched, setTouched] = useState<
    Partial<Record<CheckoutField, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);
  const [promoApplicableInterval, setPromoApplicableInterval] =
    useState<PlanInterval | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoState, setPromoState] = useState<PromoValidationState>("idle");

  const defaultInterval =
    plan.prices.find((price) => price.interval === "month")?.interval ??
    plan.prices[0]?.interval ??
    "month";

  const [selectedInterval, setSelectedIntervalState] =
    useState<PlanInterval>(defaultInterval);

  const selectedPrice = useMemo(
    () =>
      plan.prices.find((price) => price.interval === selectedInterval) ??
      plan.prices[0] ??
      null,
    [plan.prices, selectedInterval],
  );

  const { monthly, yearly } = useMemo(
    () => getMonthlyAndYearlyPrices(plan.prices),
    [plan.prices],
  );

  const isEnterprise = plan.code === "enterprise";
  const isFree = selectedPrice?.amount === 0;
  const requiresCardFields = !isFree;
  const cardBrand = useMemo(
    () => detectCardBrand(formData.cardNumber),
    [formData.cardNumber],
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: selectedPrice?.currency ?? "USD",
        maximumFractionDigits: 0,
      }),
    [locale, selectedPrice?.currency],
  );

  const pricingOptions = useMemo<PricingOption[]>(() => {
    return plan.prices.map((price) => {
      const isYearly = price.interval === "year";
      const yearlySavings =
        isYearly && monthly && monthly.amount > 0
          ? Math.round((1 - price.amount / (monthly.amount * 12)) * 100)
          : null;

      return {
        interval: price.interval,
        title: isYearly
          ? t("checkout.annualPlanTitle")
          : t("checkout.monthlyPlanTitle"),
        description: isYearly
          ? t("checkout.annualPlanDescription")
          : t("checkout.monthlyPlanDescription"),
        priceLabel: currencyFormatter.format(price.amount),
        cadenceLabel:
          price.interval === "month"
            ? t("checkout.perMonth")
            : t("checkout.perYear"),
        savingsLabel:
          yearlySavings && yearlySavings > 0
            ? t("checkout.savingsBadge", { percent: yearlySavings })
            : null,
      };
    });
  }, [currencyFormatter, monthly, plan.prices, t]);

  const subtotalAmount = selectedPrice?.amount ?? 0;
  const computedDiscountAmount =
    promoDiscountPercent > 0
      ? Math.max(0, subtotalAmount * (promoDiscountPercent / 100))
      : 0;

  const totalLabel = selectedPrice
    ? currencyFormatter.format(
        Math.max(0, selectedPrice.amount - computedDiscountAmount),
      )
    : t("checkout.customPricing");

  const subtotalLabel = currencyFormatter.format(subtotalAmount);
  const discountAmountLabel = currencyFormatter.format(computedDiscountAmount);

  const totalCadence =
    selectedPrice?.interval === "year"
      ? t("checkout.perYear")
      : t("checkout.perMonth");

  const validate = useCallback(
    (value: PaymentFormData): FieldErrorMap => {
      if (!requiresCardFields) return {};

      const errors: FieldErrorMap = {};

      if (!value.cardName.trim()) {
        errors.cardName = t("checkout.errors.cardNameRequired");
      } else if (value.cardName.trim().length < 2) {
        errors.cardName = t("checkout.errors.cardNameTooShort");
      }

      const cardDigits = value.cardNumber.replace(/\D/g, "");
      const detectedBrand = detectCardBrand(cardDigits);
      const requiredLength = detectedBrand === "amex" ? 15 : 16;
      if (!cardDigits) {
        errors.cardNumber = t("checkout.errors.cardNumberRequired");
      } else if (
        cardDigits.length !== requiredLength ||
        !isValidLuhn(cardDigits)
      ) {
        errors.cardNumber = t("checkout.errors.cardNumberInvalid");
      }

      if (!value.cardExpiry) {
        errors.cardExpiry = t("checkout.errors.cardExpiryRequired");
      } else if (!isValidExpiry(value.cardExpiry)) {
        errors.cardExpiry = t("checkout.errors.cardExpiryInvalid");
      }

      if (!value.cardCvc) {
        errors.cardCvc = t("checkout.errors.cardCvcRequired");
      } else if (detectedBrand === "amex" && !/^\d{4}$/.test(value.cardCvc)) {
        errors.cardCvc = t("checkout.errors.cardCvcAmexInvalid");
      } else if (detectedBrand !== "amex" && !/^\d{3}$/.test(value.cardCvc)) {
        errors.cardCvc = t("checkout.errors.cardCvcInvalid");
      }

      if (!value.billingCountry.trim()) {
        errors.billingCountry = t("checkout.errors.billingCountryRequired");
      }

      if (!value.billingPostalCode.trim()) {
        errors.billingPostalCode = t(
          "checkout.errors.billingPostalCodeRequired",
        );
      } else if (value.billingPostalCode.trim().length < 4) {
        errors.billingPostalCode = t(
          "checkout.errors.billingPostalCodeInvalid",
        );
      }

      return errors;
    },
    [requiresCardFields, t],
  );

  const errors = useMemo(() => validate(formData), [formData, validate]);

  const visibleErrors = useMemo<FieldErrorMap>(() => {
    if (submitted) return errors;

    const scoped: FieldErrorMap = {};
    for (const key of Object.keys(errors) as CheckoutField[]) {
      if (touched[key]) scoped[key] = errors[key];
    }
    return scoped;
  }, [errors, submitted, touched]);

  const isFormValid = useMemo(() => {
    if (!requiresCardFields) return true;
    return Object.keys(errors).length === 0;
  }, [errors, requiresCardFields]);

  const setFieldValue = useCallback((field: CheckoutField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const formatCardCvcByBrand = useCallback(
    (value: string) => formatCardCvc(value, cardBrand),
    [cardBrand],
  );

  const touchField = useCallback((field: CheckoutField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);

    if (!isFormValid) {
      const allTouched: Partial<Record<CheckoutField, boolean>> = {};
      (Object.keys(INITIAL_FORM_DATA) as CheckoutField[]).forEach((field) => {
        allTouched[field] = true;
      });
      setTouched(allTouched);
      return;
    }

    setIsPending(true);
    try {
      await onPay(plan.code, selectedPrice?.externalId);
    } finally {
      setIsPending(false);
    }
  }, [isFormValid, onPay, plan.code, selectedPrice?.externalId]);

  const applyPromoCode = useCallback(async () => {
    const code = promoCodeInput.trim();

    if (!code) {
      setPromoState("error");
      setPromoMessage(t("checkout.promo.errors.invalid"));
      return;
    }

    if (
      appliedPromoCode &&
      code.toUpperCase() === appliedPromoCode.toUpperCase()
    ) {
      setPromoState("error");
      setPromoMessage(t("checkout.promo.errors.alreadyApplied"));
      return;
    }

    setPromoState("validating");
    setPromoMessage(null);

    try {
      const response = await fetch("/api/subscriptions/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          appliedCode: appliedPromoCode,
          interval: selectedInterval,
        }),
      });

      const payload = (await response.json()) as PromoCodeResponse;

      if (!response.ok || !payload.ok) {
        if (payload.error === "EXPIRED_CODE") {
          setPromoMessage(t("checkout.promo.errors.expired"));
        } else if (payload.error === "INTERVAL_NOT_ALLOWED") {
          setPromoMessage(t("checkout.promo.errors.intervalNotAllowed"));
        } else if (payload.error === "ALREADY_APPLIED") {
          setPromoMessage(t("checkout.promo.errors.alreadyApplied"));
        } else {
          setPromoMessage(t("checkout.promo.errors.invalid"));
        }
        setPromoState("error");
        return;
      }

      setAppliedPromoCode(payload.code ?? code.toUpperCase());
      setPromoCodeInput("");
      setPromoDiscountPercent(payload.discountPercent ?? 0);
      setPromoApplicableInterval(payload.applicableInterval ?? null);
      setPromoState("applied");
      setPromoMessage(
        t("checkout.promo.applied", { percent: payload.discountPercent ?? 0 }),
      );
    } catch {
      setPromoState("error");
      setPromoMessage(t("checkout.promo.errors.invalid"));
    }
  }, [appliedPromoCode, promoCodeInput, selectedInterval, t]);

  const removePromoCode = useCallback(() => {
    if (!appliedPromoCode) return;

    setAppliedPromoCode(null);
    setPromoDiscountPercent(0);
    setPromoApplicableInterval(null);
    setPromoState("removed");
    setPromoMessage(t("checkout.promo.removed"));
  }, [appliedPromoCode, t]);

  const setSelectedInterval = useCallback(
    (interval: PlanInterval) => {
      setSelectedIntervalState(interval);
      if (
        appliedPromoCode &&
        promoApplicableInterval &&
        promoApplicableInterval !== interval
      ) {
        setAppliedPromoCode(null);
        setPromoDiscountPercent(0);
        setPromoApplicableInterval(null);
        setPromoState("error");
        setPromoMessage(t("checkout.promo.errors.intervalNotAllowed"));
      }
    },
    [appliedPromoCode, promoApplicableInterval, t],
  );

  return {
    t,
    paymentMode,
    setPaymentMode,
    isPending,
    selectedPrice,
    selectedInterval,
    setSelectedInterval,
    monthly,
    yearly,
    pricingOptions,
    subtotalLabel,
    totalLabel,
    totalCadence,
    discountAmountLabel,
    isEnterprise,
    isFree,
    cardBrand,
    formData,
    visibleErrors,
    isFormValid,
    promoCodeInput,
    setPromoCodeInput,
    appliedPromoCode,
    promoDiscountPercent,
    promoMessage,
    promoState,
    applyPromoCode,
    removePromoCode,
    handleSubmit,
    setFieldValue,
    touchField,
    formatCardNumber,
    formatCardExpiry,
    formatCardCvc: formatCardCvcByBrand,
  };
}
