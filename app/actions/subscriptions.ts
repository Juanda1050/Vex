"use server";

import { getLocale } from "next-intl/server";
import { requireAuth } from "@/server/auth";
import { subscriptionService } from "@/server/subscriptions";
import {
  getSubscriptionErrorStatus,
  getSubscriptionErrorTranslatorByLocale,
  mapSubscriptionErrorToKey,
  type SubscriptionApiErrorKey,
} from "@/server/subscriptions/api/error-translator";
import { requireBillingAccess } from "@/server/subscriptions/guards";
import { changePlanSchema } from "@/server/subscriptions/validations/subscription.schema";
import { revalidatePath } from "next/cache";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";

export interface SubscriptionActionResult<T = unknown> {
  success: boolean;
  error: string | null;
  errorKey?: SubscriptionApiErrorKey | null;
  status?: HttpStatusCode;
  data?: T;
}

async function getSubscriptionActionErrorTranslator() {
  const locale = await getLocale();
  return getSubscriptionErrorTranslatorByLocale(locale);
}

export async function getCurrentSubscriptionAction(): Promise<SubscriptionActionResult> {
  const errors = await getSubscriptionActionErrorTranslator();

  try {
    const ctx = await requireAuth();
    const subscription = await subscriptionService.getTenantSubscription(
      ctx.tenantId,
    );

    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
      data: subscription,
    };
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "currentFetchFailed");
    const status = getSubscriptionErrorStatus(key);

    return {
      success: false,
      errorKey: key,
      status,
      error: errors.fromKey(key),
    };
  }
}

export async function listSubscriptionPlansAction(): Promise<SubscriptionActionResult> {
  const errors = await getSubscriptionActionErrorTranslator();

  try {
    const plans = await subscriptionService.listOfferedPlans();
    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
      data: plans,
    };
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "plansFetchFailed");
    const status = getSubscriptionErrorStatus(key);

    return {
      success: false,
      errorKey: key,
      status,
      error: errors.fromKey(key),
    };
  }
}

export async function changeSubscriptionPlanAction(
  formData: FormData,
): Promise<SubscriptionActionResult> {
  const errors = await getSubscriptionActionErrorTranslator();

  try {
    const ctx = await requireBillingAccess();

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
        errorKey: key,
        status: getSubscriptionErrorStatus(key),
        error: errors.fromKey(key),
      };
    }

    const updated = await subscriptionService.changeTenantPlan({
      tenantId: ctx.tenantId,
      planCode: parsed.data.planCode,
      priceId: parsed.data.priceId,
    });

    revalidatePath("/");

    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
      data: updated,
    };
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "changeFailed");
    const status = getSubscriptionErrorStatus(key);

    return {
      success: false,
      errorKey: key,
      status,
      error: errors.fromKey(key),
    };
  }
}

export async function cancelSubscriptionAction(): Promise<SubscriptionActionResult> {
  const errors = await getSubscriptionActionErrorTranslator();

  try {
    const ctx = await requireBillingAccess();
    const canceled = await subscriptionService.cancelTenantSubscription(
      ctx.tenantId,
    );

    revalidatePath("/");

    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
      data: canceled,
    };
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "cancelFailed");
    const status = getSubscriptionErrorStatus(key);

    return {
      success: false,
      errorKey: key,
      status,
      error: errors.fromKey(key),
    };
  }
}

export async function reactivateSubscriptionAction(): Promise<SubscriptionActionResult> {
  const errors = await getSubscriptionActionErrorTranslator();

  try {
    const ctx = await requireBillingAccess();
    const reactivated = await subscriptionService.reactivateTenantSubscription(
      ctx.tenantId,
    );

    revalidatePath("/");

    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
      data: reactivated,
    };
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "reactivateFailed");
    const status = getSubscriptionErrorStatus(key);

    return {
      success: false,
      errorKey: key,
      status,
      error: errors.fromKey(key),
    };
  }
}
