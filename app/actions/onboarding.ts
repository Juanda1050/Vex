"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth/get-onboarding-state";
import { invalidateAuthStateCache } from "@/server/auth/cache/auth-state-cache";
import { authRepository } from "@/server/auth/repository/auth.repository";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";
import { subscriptionService } from "@/server/subscriptions";
import {
  getSubscriptionErrorStatus,
  getSubscriptionErrorTranslatorByLocale,
  mapSubscriptionErrorToKey,
  type SubscriptionApiErrorKey,
} from "@/server/subscriptions/api/error-translator";
import { changePlanSchema } from "@/server/subscriptions/validations/subscription.schema";

export interface OnboardingActionResult {
  success: boolean;
  error: string | null;
  errorKey?: SubscriptionApiErrorKey | "unauthorized" | null;
  status?: HttpStatusCode;
  selectedPlanCode?: string | null;
}

export async function selectOnboardingPlanAction(
  _prev: OnboardingActionResult,
  formData: FormData,
): Promise<OnboardingActionResult> {
  const locale = await getLocale();
  const errors = await getSubscriptionErrorTranslatorByLocale(locale);
  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated || !onboarding.tenantId) {
    return {
      success: false,
      error: errors.fromKey("billingAccessDenied"),
      errorKey: "unauthorized",
      status: HTTP_STATUS.UNAUTHORIZED,
      selectedPlanCode: null,
    };
  }

  if (!onboarding.hasBillingAccess) {
    return {
      success: false,
      error: errors.fromKey("billingAccessDenied"),
      errorKey: "billingAccessDenied",
      status: HTTP_STATUS.FORBIDDEN,
      selectedPlanCode: null,
    };
  }

  const parsed = changePlanSchema.safeParse({
    planCode: formData.get("planCode"),
    priceId: (formData.get("priceId") as string | null) ?? undefined,
  });

  if (!parsed.success) {
    const issueKey = parsed.error.issues[0]?.message;
    const key: SubscriptionApiErrorKey =
      issueKey === "planCodeRequired" || issueKey === "invalidPriceId"
        ? issueKey
        : "invalidPayload";

    return {
      success: false,
      error: errors.fromKey(key),
      errorKey: key,
      status: getSubscriptionErrorStatus(key),
      selectedPlanCode: null,
    };
  }

  try {
    const updated = await subscriptionService.changeTenantPlan({
      tenantId: onboarding.tenantId,
      planCode: parsed.data.planCode,
      priceId: parsed.data.priceId,
    });

    revalidatePath(`/${locale}/dashboard`);

    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
      selectedPlanCode: updated.plan.code,
    };
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "changeFailed");
    const status = getSubscriptionErrorStatus(key);

    return {
      success: false,
      error: errors.fromKey(key),
      errorKey: key,
      status,
      selectedPlanCode: null,
    };
  }
}

export async function completeOnboardingAction(
  prev: OnboardingActionResult,
  formData: FormData,
): Promise<OnboardingActionResult> {
  void prev;
  void formData;

  const locale = await getLocale();
  const onboarding = await getOnboardingState();
  const errors = await getSubscriptionErrorTranslatorByLocale(locale);

  if (!onboarding.isAuthenticated || !onboarding.userId) {
    return {
      success: false,
      error: errors.fromKey("billingAccessDenied"),
      errorKey: "unauthorized",
      status: HTTP_STATUS.UNAUTHORIZED,
      selectedPlanCode: null,
    };
  }

  await authRepository.markOnboardingCompleted(onboarding.userId);
  invalidateAuthStateCache(onboarding.userId);

  revalidatePath(`/${locale}/onboarding`);
  revalidatePath(`/${locale}/dashboard`);

  return {
    success: true,
    error: null,
    errorKey: null,
    status: HTTP_STATUS.OK,
    selectedPlanCode: null,
  };
}

export async function completeOnboardingAndRedirectAction(
  formData: FormData,
): Promise<void> {
  void formData;

  const locale = await getLocale();
  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated || !onboarding.userId) {
    redirect(`/${locale}/login`);
  }

  await authRepository.markOnboardingCompleted(onboarding.userId);
  invalidateAuthStateCache(onboarding.userId);
  revalidatePath(`/${locale}/onboarding`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(`/${locale}/dashboard`);
}
