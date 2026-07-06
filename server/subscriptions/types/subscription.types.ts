export type BillingInterval = "DAY" | "WEEK" | "MONTH" | "YEAR";
export type BillingProvider = "INTERNAL" | "STRIPE";
export type PlanTier = "FREE" | "PREMIUM" | "ENTERPRISE";
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED"
  | "INCOMPLETE"
  | "PAUSED";

export interface PlanPriceSummary {
  id: string;
  nickname: string | null;
  amount: string;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  trialDays: number | null;
  provider: BillingProvider;
}

export interface SubscriptionPlanSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: PlanTier;
  features: Record<string, unknown>;
  isPublic: boolean;
  prices: PlanPriceSummary[];
}

export interface TenantSubscriptionSummary {
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
  };
  price: PlanPriceSummary | null;
}

export interface EffectiveSubscription {
  planCode: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  isPremium: boolean;
}
