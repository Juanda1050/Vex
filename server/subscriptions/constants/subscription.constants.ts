export const FREE_PLAN_CODE = "FREE";
export const PREMIUM_PLAN_CODE = "PREMIUM";

export const DEFAULT_BILLING_CURRENCY = "USD";

export const SUBSCRIPTION_EVENT_TYPES = {
  CREATED: "subscription.created",
  CHANGED_PLAN: "subscription.changed_plan",
  CANCELED: "subscription.canceled",
  REACTIVATED: "subscription.reactivated",
} as const;

export type SubscriptionEventType =
  (typeof SUBSCRIPTION_EVENT_TYPES)[keyof typeof SUBSCRIPTION_EVENT_TYPES];
