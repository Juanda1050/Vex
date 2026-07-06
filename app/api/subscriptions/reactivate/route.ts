import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/server/subscriptions";
import { requireBillingAccess } from "@/server/subscriptions/guards";
import {
  getSubscriptionApiErrorTranslator,
  getSubscriptionErrorStatus,
  mapSubscriptionErrorToKey,
} from "@/server/subscriptions/api/error-translator";

export async function POST(request: NextRequest) {
  const translator = await getSubscriptionApiErrorTranslator(request);

  try {
    const ctx = await requireBillingAccess();
    const reactivated = await subscriptionService.reactivateTenantSubscription(
      ctx.tenantId,
    );

    return NextResponse.json({ ok: true, data: reactivated });
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "reactivateFailed");
    const status = getSubscriptionErrorStatus(key);

    return NextResponse.json(
      {
        ok: false,
        errorKey: key,
        error: translator.fromKey(key),
        status,
      },
      { status },
    );
  }
}
