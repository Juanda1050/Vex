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
 *   mvp.onboarding.planContent.<code>.name
 *   mvp.onboarding.planContent.<code>.summary
 *
 * Feature keys reference:
 *   mvp.onboarding.planFeatures.<key>.label
 */
export const PLANS: PlanDefinition[] = [
  {
    code: "free",
    nameKey: "mvp.onboarding.planContent.free.name",
    descriptionKey: "mvp.onboarding.planContent.free.summary",
    prices: [{ amount: 0, currency: "USD", interval: "month" }],
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
    nameKey: "mvp.onboarding.planContent.premium.name",
    descriptionKey: "mvp.onboarding.planContent.premium.summary",
    prices: [{ amount: 49, currency: "USD", interval: "month" }],
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
    nameKey: "mvp.onboarding.planContent.enterprise.name",
    descriptionKey: "mvp.onboarding.planContent.enterprise.summary",
    prices: [{ amount: 0, currency: "USD", interval: "month" }],
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
