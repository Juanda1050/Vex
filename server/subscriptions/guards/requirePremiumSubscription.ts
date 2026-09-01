import { requireAuth } from "@/server/auth/guards/requireAuth";
import { subscriptionService } from "../service/subscription.service";

export async function requirePremiumSubscription() {
  const ctx = await requireAuth();

  const current = await subscriptionService.getTenantSubscription(ctx.tenantId);
  const isPremium = current
    ? subscriptionService.isPremiumPlan(current.plan.tier, current.status)
    : false;

  if (!isPremium) {
    throw new Error("Esta funcionalidad requiere un plan premium activo.");
  }

  return {
    ...ctx,
    subscription: current,
  };
}
