import {
  FREE_PLAN_CODE,
  PREMIUM_PLAN_CODE,
  SUBSCRIPTION_EVENT_TYPES,
} from "../constants/subscription.constants";
import { unstable_cache } from "next/cache";
import { subscriptionRepository } from "../repository/subscription.repository";
import type {
  PublicPlanRecord,
  TenantSubscriptionSummaryRecord,
} from "../repository/subscription.repository";
import type {
  BillingInterval,
  BillingProvider,
  EffectiveSubscription,
  PlanTier,
  SubscriptionPlanSummary,
  SubscriptionStatus,
  TenantSubscriptionSummary,
} from "../types/subscription.types";

const PREMIUM_TIERS = new Set<PlanTier>(["PREMIUM", "ENTERPRISE"]);
const PREMIUM_STATUSES = new Set<SubscriptionStatus>([
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
]);

const getCachedPublicPlans = unstable_cache(
  async () => subscriptionRepository.listPublicPlans(),
  ["subscription-public-plans"],
  {
    revalidate: 300,
    tags: ["subscription-plans"],
  },
);

const toSummary = (
  subscription: TenantSubscriptionSummaryRecord,
): TenantSubscriptionSummary => ({
  id: subscription.id,
  tenantId: subscription.tenantId,
  status: subscription.status,
  isCurrent: subscription.isCurrent,
  startedAt: subscription.startedAt,
  currentPeriodStart: subscription.currentPeriodStart,
  currentPeriodEnd: subscription.currentPeriodEnd,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  canceledAt: subscription.canceledAt,
  endedAt: subscription.endedAt,
  trialStart: subscription.trialStart,
  trialEnd: subscription.trialEnd,
  provider: subscription.provider,
  providerCustomerId: subscription.providerCustomerId,
  providerSubscriptionId: subscription.providerSubscriptionId,
  plan: {
    id: subscription.plan.id,
    code: subscription.plan.code,
    name: subscription.plan.name,
    tier: subscription.plan.tier,
    features: subscription.plan.features as Record<string, unknown>,
  },
  price: priceToSummary(subscription.price),
});

const priceToSummary = (
  price: {
    id: string;
    nickname: string | null;
    amount: unknown;
    currency: string;
    interval: BillingInterval;
    intervalCount: number;
    trialDays: number | null;
    provider: BillingProvider;
  } | null,
) => {
  if (!price) return null;

  return {
    id: price.id,
    nickname: price.nickname,
    amount: String(price.amount),
    currency: price.currency,
    interval: price.interval,
    intervalCount: price.intervalCount,
    trialDays: price.trialDays,
    provider: price.provider,
  };
};

export class SubscriptionService {
  async listOfferedPlans(): Promise<SubscriptionPlanSummary[]> {
    const plans = await getCachedPublicPlans();

    return plans.map((plan: PublicPlanRecord) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      tier: plan.tier,
      features: (plan.features as Record<string, unknown>) ?? {},
      isPublic: plan.isPublic,
      prices: plan.prices.map((price: PublicPlanRecord["prices"][number]) => ({
        id: price.id,
        nickname: price.nickname,
        amount: String(price.amount),
        currency: price.currency,
        interval: price.interval,
        intervalCount: price.intervalCount,
        trialDays: price.trialDays,
        provider: price.provider,
      })),
    }));
  }

  async getTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionSummary | null> {
    const current =
      await subscriptionRepository.findCurrentByTenantId(tenantId);
    if (!current) return null;

    return toSummary(current);
  }

  async getUserEffectiveSubscription(
    userId: string,
  ): Promise<EffectiveSubscription> {
    const membership = await subscriptionRepository.findCurrentByUserId(userId);
    const current = membership?.tenant.subscriptions[0];

    if (!current) {
      return {
        planCode: FREE_PLAN_CODE,
        planTier: "FREE",
        status: "ACTIVE",
        isPremium: false,
      };
    }

    return {
      planCode: current.plan.code,
      planTier: current.plan.tier,
      status: current.status,
      isPremium: this.isPremiumPlan(current.plan.tier, current.status),
    };
  }

  async changeTenantPlan(data: {
    tenantId: string;
    planCode: string;
    priceId?: string;
    status?: SubscriptionStatus;
  }): Promise<TenantSubscriptionSummary> {
    const plan = await subscriptionRepository.findPlanByCode(data.planCode);
    if (!plan || !plan.isActive) {
      throw new Error(`Plan no disponible: ${data.planCode}`);
    }

    const selectedPrice =
      (data.priceId
        ? plan.prices.find((price) => price.id === data.priceId)
        : null) ??
      plan.prices.find((price) => price.interval === "MONTH") ??
      plan.prices[0] ??
      null;

    if (data.priceId && !selectedPrice) {
      throw new Error("El precio seleccionado no pertenece al plan indicado.");
    }

    const current = await subscriptionRepository.findCurrentByTenantId(
      data.tenantId,
    );

    if (
      current &&
      current.plan.code === plan.code &&
      (current.price?.id ?? null) === (selectedPrice?.id ?? null)
    ) {
      return toSummary(current);
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = selectedPrice
      ? this.calculatePeriodEnd(
          currentPeriodStart,
          selectedPrice.interval,
          selectedPrice.intervalCount,
        )
      : null;

    const updated = await subscriptionRepository.replaceCurrentSubscription({
      tenantId: data.tenantId,
      planId: plan.id,
      priceId: selectedPrice?.id,
      status: data.status ?? "ACTIVE",
      currentPeriodStart,
      currentPeriodEnd,
    });

    await subscriptionRepository.createEvent({
      subscriptionId: updated.id,
      type: SUBSCRIPTION_EVENT_TYPES.CHANGED_PLAN,
      payload: {
        tenantId: data.tenantId,
        planCode: updated.plan.code,
        priceId: selectedPrice?.id ?? null,
      },
    });

    return toSummary(updated);
  }

  async cancelTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionSummary> {
    const current =
      await subscriptionRepository.findCurrentByTenantId(tenantId);
    if (!current) {
      throw new Error("No existe una suscripción activa para cancelar.");
    }

    const canceled = await subscriptionRepository.cancelAtPeriodEnd(current.id);

    await subscriptionRepository.createEvent({
      subscriptionId: canceled.id,
      type: SUBSCRIPTION_EVENT_TYPES.CANCELED,
      payload: {
        tenantId,
        cancelAtPeriodEnd: true,
      },
    });

    return toSummary(canceled);
  }

  async reactivateTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionSummary> {
    const current =
      await subscriptionRepository.findCurrentByTenantId(tenantId);
    if (!current) {
      throw new Error("No existe una suscripción activa para reactivar.");
    }

    const reactivated = await subscriptionRepository.reactivate(current.id);

    await subscriptionRepository.createEvent({
      subscriptionId: reactivated.id,
      type: SUBSCRIPTION_EVENT_TYPES.REACTIVATED,
      payload: {
        tenantId,
        cancelAtPeriodEnd: false,
      },
    });

    return toSummary(reactivated);
  }

  isPremiumPlan(planTier: PlanTier, status: SubscriptionStatus): boolean {
    return PREMIUM_TIERS.has(planTier) && PREMIUM_STATUSES.has(status);
  }

  isPremiumCode(planCode: string): boolean {
    return planCode === PREMIUM_PLAN_CODE;
  }

  private calculatePeriodEnd(
    start: Date,
    interval: BillingInterval,
    intervalCount: number,
  ): Date {
    const end = new Date(start);

    if (interval === "DAY") end.setDate(end.getDate() + intervalCount);
    if (interval === "WEEK") end.setDate(end.getDate() + 7 * intervalCount);
    if (interval === "MONTH") end.setMonth(end.getMonth() + intervalCount);
    if (interval === "YEAR") end.setFullYear(end.getFullYear() + intervalCount);

    return end;
  }
}

export const subscriptionService = new SubscriptionService();
