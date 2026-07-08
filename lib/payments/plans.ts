export type PlanInterval = "month" | "year";

export interface PlanPrice {
  amount: number;
  currency: string;
  interval: PlanInterval;
  /**
   * Will hold the Stripe Price ID or Mercado Pago preference ID
   * once the payment gateway is connected.
   */
  externalId?: string;
}

export interface PlanFeatureEntry {
  key: string;
  value: string | number | boolean | null;
}

export interface PlanDefinition {
  code: string;
  nameKey: string;
  descriptionKey: string;
  prices: PlanPrice[];
  features: PlanFeatureEntry[];
  highlighted?: boolean;
}

/**
 * Static plan catalogue.
 *
 * Name and description keys reference the i18n namespace:
 *   onboarding.planContent.<code>.name
 *   onboarding.planContent.<code>.summary
 *
 * Feature keys reference:
 *   onboarding.planFeatures.<key>.label
 */
export const PLANS: PlanDefinition[] = [
  {
    code: "free",
    nameKey: "onboarding.planContent.free.name",
    descriptionKey: "onboarding.planContent.free.summary",
    prices: [
      {
        amount: 0,
        currency: "USD",
        interval: "month",
        externalId: "internal-free-monthly",
      },
    ],
    features: [
      { key: "productsLimit", value: 50 },
      { key: "usersLimit", value: 3 },
      { key: "warehousesLimit", value: 1 },
      { key: "reports", value: false },
      { key: "support", value: "community" },
    ],
  },
  {
    code: "premium",
    nameKey: "onboarding.planContent.premium.name",
    descriptionKey: "onboarding.planContent.premium.summary",
    prices: [
      {
        amount: 29,
        currency: "USD",
        interval: "month",
        externalId: "internal-premium-monthly",
      },
      {
        amount: 290,
        currency: "USD",
        interval: "year",
        externalId: "internal-premium-yearly",
      },
    ],
    features: [
      { key: "productsLimit", value: 500 },
      { key: "usersLimit", value: 15 },
      { key: "warehousesLimit", value: 5 },
      { key: "reports", value: true },
      { key: "support", value: "priority" },
    ],
    highlighted: true,
  },
  {
    code: "enterprise",
    nameKey: "onboarding.planContent.enterprise.name",
    descriptionKey: "onboarding.planContent.enterprise.summary",
    prices: [
      {
        amount: 99,
        currency: "USD",
        interval: "month",
        externalId: "internal-enterprise-monthly",
      },
      {
        amount: 950,
        currency: "USD",
        interval: "year",
        externalId: "internal-enterprise-yearly",
      },
    ],
    features: [
      { key: "productsLimit", value: null },
      { key: "usersLimit", value: null },
      { key: "warehousesLimit", value: null },
      { key: "reports", value: true },
      { key: "support", value: "dedicated" },
      { key: "sso", value: true },
    ],
  },
];

export function getPlanByCode(code: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.code === code);
}
