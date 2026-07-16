import { requireAuth } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export const FEATURE_KEYS = {
  POS_ENABLED: "pos.enabled",
  POS_MULTI_REGISTER: "pos.multi_register",
  POS_SCANNER_HID: "pos.scanner_hid",
  POS_REFUNDS: "pos.refunds",
  INVENTORY_MULTI_LOCATION: "inventory.multi_location",
  INVENTORY_NEGATIVE_STOCK_ALLOWED: "inventory.negative_stock_allowed",
  PRICING_PRICE_LISTS: "pricing.price_lists",
  PRICING_PROMOTIONS_BASIC: "pricing.promotions_basic",
  PRICING_PROMOTIONS_ADVANCED: "pricing.promotions_advanced",
} as const;

export const LIMIT_KEYS = {
  PRODUCTS_MAX: "limits.products.max",
  MONTHLY_SALES_MAX: "limits.monthly_sales.max",
  LOCATIONS_MAX: "limits.locations.max",
  REGISTERS_MAX: "limits.registers.max",
  USERS_MAX: "limits.users.max",
  PRICE_LISTS_MAX: "limits.price_lists.max",
} as const;

type PlanFeatureMap = Record<
  string,
  {
    enabled: boolean;
    limit: number | null;
  }
>;

type PlanContext = {
  planCode: string;
  features: PlanFeatureMap;
};

function toFeatureMapFromLegacy(features: unknown): PlanFeatureMap {
  const raw = (features ?? {}) as Record<string, unknown>;
  const mapped: PlanFeatureMap = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "boolean") {
      mapped[key] = { enabled: value, limit: null };
      continue;
    }

    if (typeof value === "number") {
      mapped[key] = { enabled: true, limit: value };
      continue;
    }

    if (value === null) {
      mapped[key] = { enabled: true, limit: null };
    }
  }

  if (mapped.productsLimit && !mapped[LIMIT_KEYS.PRODUCTS_MAX]) {
    mapped[LIMIT_KEYS.PRODUCTS_MAX] = mapped.productsLimit;
  }

  if (mapped.usersLimit && !mapped[LIMIT_KEYS.USERS_MAX]) {
    mapped[LIMIT_KEYS.USERS_MAX] = mapped.usersLimit;
  }

  if (mapped.warehousesLimit && !mapped[LIMIT_KEYS.LOCATIONS_MAX]) {
    mapped[LIMIT_KEYS.LOCATIONS_MAX] = mapped.warehousesLimit;
  }

  return mapped;
}

async function getTenantPlanContext(tenantId: string): Promise<PlanContext> {
  const current = await prisma.subscription.findFirst({
    where: {
      tenantId,
      isCurrent: true,
    },
    include: {
      plan: {
        include: {
          features: true,
        },
      },
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  if (current) {
    const features: PlanFeatureMap = {};
    for (const feature of current.plan.features) {
      features[feature.featureKey] = {
        enabled: feature.enabled,
        limit: feature.limitValue,
      };
    }

    return {
      planCode: current.plan.code,
      features,
    };
  }

  const legacy = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      isCurrent: true,
    },
    include: {
      plan: {
        select: {
          code: true,
          features: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (!legacy) {
    return {
      planCode: "FREE",
      features: {},
    };
  }

  return {
    planCode: legacy.plan.code,
    features: toFeatureMapFromLegacy(legacy.plan.features),
  };
}

export async function requireFeature(featureKey: string) {
  const ctx = await requireAuth();
  const planContext = await getTenantPlanContext(ctx.tenantId);

  const feature = planContext.features[featureKey];
  if (!feature?.enabled) {
    throw new Error(
      `La funcionalidad ${featureKey} no esta disponible en tu plan.`,
    );
  }

  return {
    ...ctx,
    planContext,
  };
}

export async function enforceLimit(limitKey: string, currentUsage: number) {
  const ctx = await requireAuth();
  const planContext = await getTenantPlanContext(ctx.tenantId);

  const configured = planContext.features[limitKey];
  if (!configured || configured.limit === null) {
    return {
      exceeded: false,
      limit: null,
      used: currentUsage,
    };
  }

  if (currentUsage >= configured.limit) {
    throw new Error(
      `Limite del plan alcanzado para ${limitKey}: ${currentUsage}/${configured.limit}.`,
    );
  }

  return {
    exceeded: false,
    limit: configured.limit,
    used: currentUsage,
  };
}

export async function getBillingFeaturesForTenant(tenantId: string) {
  const planContext = await getTenantPlanContext(tenantId);

  return {
    planCode: planContext.planCode,
    features: Object.entries(planContext.features).map(([key, value]) => ({
      key,
      enabled: value.enabled,
      limit: value.limit,
    })),
  };
}
