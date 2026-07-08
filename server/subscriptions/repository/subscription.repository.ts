import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FREE_PLAN_CODE } from "../constants/subscription.constants";
import type {
  BillingInterval,
  BillingProvider,
  PlanTier,
  SubscriptionStatus,
} from "../types/subscription.types";

interface PriceRecord {
  id: string;
  nickname: string | null;
  amount: unknown;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  trialDays: number | null;
  provider: BillingProvider;
}

interface PlanRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  tier: PlanTier;
  features?: unknown;
  isPublic?: boolean;
  isActive?: boolean;
  prices: PriceRecord[];
}

interface TenantSubscriptionSummaryRecord {
  id: string;
  tenantId: string;
  status: SubscriptionStatus;
  isCurrent: boolean;
  startedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  endedAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  provider: BillingProvider;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
    tier: PlanTier;
    features: unknown;
  };
  price: PriceRecord | null;
}

interface PublicPlanRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: PlanTier;
  features: unknown;
  isPublic: boolean;
  prices: PriceRecord[];
}

const subscriptionSummaryInclude = {
  plan: {
    select: {
      id: true,
      code: true,
      name: true,
      tier: true,
      features: true,
    },
  },
  price: {
    select: {
      id: true,
      nickname: true,
      amount: true,
      currency: true,
      interval: true,
      intervalCount: true,
      trialDays: true,
      provider: true,
    },
  },
};

export class SubscriptionRepository {
  async listPublicPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        tier: true,
        features: true,
        isPublic: true,
        prices: {
          where: { isActive: true },
          orderBy: [{ amount: "asc" }, { intervalCount: "asc" }],
          select: {
            id: true,
            nickname: true,
            amount: true,
            currency: true,
            interval: true,
            intervalCount: true,
            trialDays: true,
            provider: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return plans as PublicPlanRecord[];
  }

  async findPlanByCode(code: string): Promise<PlanRecord | null> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: [{ amount: "asc" }, { intervalCount: "asc" }],
        },
      },
    });

    return plan as PlanRecord | null;
  }

  async findCurrentByTenantId(
    tenantId: string,
  ): Promise<TenantSubscriptionSummaryRecord | null> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        isCurrent: true,
      },
      include: subscriptionSummaryInclude,
      orderBy: [{ startedAt: "desc" }],
    });

    return subscription as TenantSubscriptionSummaryRecord | null;
  }

  async findCurrentByUserId(userId: string) {
    return prisma.tenantMember.findFirst({
      where: { userId, isActive: true },
      select: {
        tenantId: true,
        tenant: {
          select: {
            subscriptions: {
              where: { isCurrent: true },
              include: subscriptionSummaryInclude,
              orderBy: [{ startedAt: "desc" }],
              take: 1,
            },
          },
        },
      },
    });
  }

  async createSubscription(data: {
    tenantId: string;
    planId: string;
    priceId?: string | null;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date | null;
    trialStart?: Date | null;
    trialEnd?: Date | null;
    isCurrent?: boolean;
  }): Promise<TenantSubscriptionSummaryRecord> {
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId: data.tenantId,
        planId: data.planId,
        priceId: data.priceId,
        status: data.status ?? "ACTIVE",
        isCurrent: data.isCurrent ?? true,
        currentPeriodStart: data.currentPeriodStart ?? new Date(),
        currentPeriodEnd: data.currentPeriodEnd,
        trialStart: data.trialStart,
        trialEnd: data.trialEnd,
      },
      include: subscriptionSummaryInclude,
    });

    return subscription as TenantSubscriptionSummaryRecord;
  }

  async replaceCurrentSubscription(data: {
    tenantId: string;
    planId: string;
    priceId?: string | null;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date | null;
    trialStart?: Date | null;
    trialEnd?: Date | null;
  }): Promise<TenantSubscriptionSummaryRecord> {
    const subscription = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.tenantSubscription.updateMany({
          where: { tenantId: data.tenantId, isCurrent: true },
          data: {
            isCurrent: false,
            endedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const created = await tx.tenantSubscription.create({
          data: {
            tenantId: data.tenantId,
            planId: data.planId,
            priceId: data.priceId,
            status: data.status ?? "ACTIVE",
            isCurrent: true,
            startedAt: new Date(),
            currentPeriodStart: data.currentPeriodStart ?? new Date(),
            currentPeriodEnd: data.currentPeriodEnd,
            trialStart: data.trialStart,
            trialEnd: data.trialEnd,
          },
          include: subscriptionSummaryInclude,
        });

        return created as TenantSubscriptionSummaryRecord;
      },
    );

    return subscription;
  }

  async cancelAtPeriodEnd(
    subscriptionId: string,
  ): Promise<TenantSubscriptionSummaryRecord> {
    const subscription = await prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: true },
      include: subscriptionSummaryInclude,
    });

    return subscription as TenantSubscriptionSummaryRecord;
  }

  async reactivate(
    subscriptionId: string,
  ): Promise<TenantSubscriptionSummaryRecord> {
    const subscription = await prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: false, canceledAt: null, endedAt: null },
      include: subscriptionSummaryInclude,
    });

    return subscription as TenantSubscriptionSummaryRecord;
  }

  async ensureFreeSubscriptionForTenant(
    tenantId: string,
  ): Promise<TenantSubscriptionSummaryRecord | null> {
    const current = await this.findCurrentByTenantId(tenantId);
    if (current) return current;

    const freePlan = await this.findPlanByCode(FREE_PLAN_CODE);
    if (!freePlan) return null;

    const defaultPrice =
      freePlan.prices.find((price) => price.interval === "MONTH") ??
      freePlan.prices[0] ??
      null;

    return this.createSubscription({
      tenantId,
      planId: freePlan.id,
      priceId: defaultPrice?.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
    });
  }

  async createEvent(data: {
    subscriptionId: string;
    type: string;
    payload?: Prisma.InputJsonValue;
  }) {
    return prisma.subscriptionEvent.create({
      data: {
        subscriptionId: data.subscriptionId,
        type: data.type,
        payload: (data.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();

export type { PublicPlanRecord, TenantSubscriptionSummaryRecord };
