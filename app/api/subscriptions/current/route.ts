import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { subscriptionService } from "@/server/subscriptions";
import {
  getSubscriptionApiErrorTranslator,
  getSubscriptionErrorStatus,
  mapSubscriptionErrorToKey,
} from "@/server/subscriptions/api/error-translator";

export async function GET(request: NextRequest) {
  const translator = await getSubscriptionApiErrorTranslator(request);

  try {
    const ctx = await requireAuth();
    const current = await subscriptionService.getTenantSubscription(
      ctx.tenantId,
    );

    return NextResponse.json({ ok: true, data: current });
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "currentFetchFailed");
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
