import { requireAuth } from "@/server/auth";
import { subscriptionService } from "./service/subscription.service";
import type { TenantSubscriptionSummary } from "./types/subscription.types";

type LimitValidationResult = {
  used: number;
  limit: number | null;
  remaining: number | null;
  exceeded: boolean;
};

function toFeatureRecord(subscription: TenantSubscriptionSummary | null) {
  return (subscription?.plan.features ?? {}) as Record<string, unknown>;
}

export function hasSubscriptionFeature(
  subscription: TenantSubscriptionSummary | null,
  featureKey: string,
): boolean {
  const value = toFeatureRecord(subscription)[featureKey];

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (value === null) return true;
  if (typeof value === "string") return value.length > 0;

  return Boolean(value);
}

export function getSubscriptionLimit(
  subscription: TenantSubscriptionSummary | null,
  limitKey: string,
): number | null {
  const value = toFeatureRecord(subscription)[limitKey];

  if (typeof value === "number") return value;
  if (value === null) return null;

  return null;
}

export function validateSubscriptionLimit(
  subscription: TenantSubscriptionSummary | null,
  limitKey: string,
  used: number,
): LimitValidationResult {
  const limit = getSubscriptionLimit(subscription, limitKey);

  if (limit === null) {
    return {
      used,
      limit,
      remaining: null,
      exceeded: false,
    };
  }

  const remaining = Math.max(limit - used, 0);

  return {
    used,
    limit,
    remaining,
    exceeded: used >= limit,
  };
}

export function enforceSubscriptionLimit(
  subscription: TenantSubscriptionSummary | null,
  limitKey: string,
  used: number,
  customMessage?: string,
) {
  const check = validateSubscriptionLimit(subscription, limitKey, used);

  if (check.exceeded && check.limit !== null) {
    throw new Error(
      customMessage ??
        `Limite del plan alcanzado para ${limitKey}: ${check.used}/${check.limit}.`,
    );
  }

  return check;
}

export async function requireSubscriptionFeature(featureKey: string) {
  const ctx = await requireAuth();
  const subscription = await subscriptionService.getTenantSubscription(
    ctx.tenantId,
  );

  if (!hasSubscriptionFeature(subscription, featureKey)) {
    throw new Error(
      `La funcionalidad ${featureKey} no está disponible en tu plan actual.`,
    );
  }

  return {
    ...ctx,
    subscription,
  };
}
