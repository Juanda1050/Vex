import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/server/subscriptions";
import { requireBillingAccess } from "@/server/subscriptions/guards";
import { changePlanSchema } from "@/server/subscriptions/validations/subscription.schema";
import {
  getSubscriptionApiErrorTranslator,
  getSubscriptionErrorStatus,
  mapSubscriptionErrorToKey,
  type SubscriptionApiErrorKey,
} from "@/server/subscriptions/api/error-translator";

export async function POST(request: NextRequest) {
  const translator = await getSubscriptionApiErrorTranslator(request);

  try {
    const ctx = await requireBillingAccess();
    const body = await request.json();

    const parsed = changePlanSchema.safeParse(body);
    if (!parsed.success) {
      const issueKey = parsed.error.issues[0]?.message;
      const key: SubscriptionApiErrorKey =
        issueKey === "planCodeRequired" || issueKey === "invalidPriceId"
          ? issueKey
          : "invalidPayload";
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

    const updated = await subscriptionService.changeTenantPlan({
      tenantId: ctx.tenantId,
      planCode: parsed.data.planCode,
      priceId: parsed.data.priceId,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const key = mapSubscriptionErrorToKey(error, "changeFailed");
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
