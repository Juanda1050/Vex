import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/server/subscriptions";
import {
  getSubscriptionApiErrorTranslator,
  getSubscriptionErrorStatus,
  mapSubscriptionErrorToKey,
} from "@/server/subscriptions/api/error-translator";

export async function GET(request: NextRequest) {
  const translator = await getSubscriptionApiErrorTranslator(request);

  try {
    const plans = await subscriptionService.listOfferedPlans();
    return NextResponse.json({ ok: true, data: plans });
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "plansFetchFailed");
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
