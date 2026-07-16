import { PrismaClient } from "@prisma/client";

import {
  SEED_POS_LOCATION_ID,
  SEED_POS_PLAN_ENTERPRISE_ID,
  SEED_POS_PLAN_FREE_ID,
  SEED_POS_PLAN_PREMIUM_ID,
  SEED_POS_SUBSCRIPTION_ID,
  SEED_TENANT_ID,
} from "./constants";

type FeatureInput = {
  key: string;
  enabled: boolean;
  limit: number | null;
};

async function upsertPlanFeatures(
  prisma: PrismaClient,
  planId: string,
  featureRows: FeatureInput[],
) {
  for (const row of featureRows) {
    await prisma.planFeature.upsert({
      where: {
        planId_featureKey: {
          planId,
          featureKey: row.key,
        },
      },
      update: {
        enabled: row.enabled,
        limitValue: row.limit,
      },
      create: {
        planId,
        featureKey: row.key,
        enabled: row.enabled,
        limitValue: row.limit,
      },
    });
  }
}

export async function seedPosBilling(prisma: PrismaClient) {
  const free = await prisma.plan.upsert({
    where: { code: "FREE" },
    update: {
      name: "Free",
      description: "Plan inicial sin POS",
      isActive: true,
      isPublic: true,
      sortOrder: 0,
    },
    create: {
      id: SEED_POS_PLAN_FREE_ID,
      code: "FREE",
      name: "Free",
      description: "Plan inicial sin POS",
      isActive: true,
      isPublic: true,
      sortOrder: 0,
    },
  });

  const premium = await prisma.plan.upsert({
    where: { code: "PREMIUM" },
    update: {
      name: "Premium",
      description: "POS basico con limites",
      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
    create: {
      id: SEED_POS_PLAN_PREMIUM_ID,
      code: "PREMIUM",
      name: "Premium",
      description: "POS basico con limites",
      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
  });

  const enterprise = await prisma.plan.upsert({
    where: { code: "ENTERPRISE" },
    update: {
      name: "Enterprise",
      description: "POS e inventario avanzado",
      isActive: true,
      isPublic: true,
      sortOrder: 2,
    },
    create: {
      id: SEED_POS_PLAN_ENTERPRISE_ID,
      code: "ENTERPRISE",
      name: "Enterprise",
      description: "POS e inventario avanzado",
      isActive: true,
      isPublic: true,
      sortOrder: 2,
    },
  });

  await upsertPlanFeatures(prisma, free.id, [
    { key: "pos.enabled", enabled: false, limit: null },
    { key: "pos.multi_register", enabled: false, limit: null },
    { key: "pos.scanner_hid", enabled: false, limit: null },
    { key: "pos.refunds", enabled: false, limit: null },
    { key: "inventory.multi_location", enabled: false, limit: null },
    { key: "inventory.negative_stock_allowed", enabled: false, limit: null },
    { key: "pricing.price_lists", enabled: false, limit: null },
    { key: "pricing.promotions_basic", enabled: false, limit: null },
    { key: "pricing.promotions_advanced", enabled: false, limit: null },
    { key: "limits.products.max", enabled: true, limit: 100 },
    { key: "limits.monthly_sales.max", enabled: true, limit: 1000 },
    { key: "limits.locations.max", enabled: true, limit: 1 },
    { key: "limits.registers.max", enabled: true, limit: 1 },
    { key: "limits.users.max", enabled: true, limit: 2 },
    { key: "limits.price_lists.max", enabled: true, limit: 1 },
  ]);

  await upsertPlanFeatures(prisma, premium.id, [
    { key: "pos.enabled", enabled: true, limit: null },
    { key: "pos.multi_register", enabled: false, limit: null },
    { key: "pos.scanner_hid", enabled: true, limit: null },
    { key: "pos.refunds", enabled: true, limit: null },
    { key: "inventory.multi_location", enabled: false, limit: null },
    { key: "inventory.negative_stock_allowed", enabled: false, limit: null },
    { key: "pricing.price_lists", enabled: true, limit: null },
    { key: "pricing.promotions_basic", enabled: true, limit: null },
    { key: "pricing.promotions_advanced", enabled: false, limit: null },
    { key: "limits.products.max", enabled: true, limit: 10000 },
    { key: "limits.monthly_sales.max", enabled: true, limit: 50000 },
    { key: "limits.locations.max", enabled: true, limit: 3 },
    { key: "limits.registers.max", enabled: true, limit: 2 },
    { key: "limits.users.max", enabled: true, limit: 15 },
    { key: "limits.price_lists.max", enabled: true, limit: 3 },
  ]);

  await upsertPlanFeatures(prisma, enterprise.id, [
    { key: "pos.enabled", enabled: true, limit: null },
    { key: "pos.multi_register", enabled: true, limit: null },
    { key: "pos.scanner_hid", enabled: true, limit: null },
    { key: "pos.refunds", enabled: true, limit: null },
    { key: "inventory.multi_location", enabled: true, limit: null },
    { key: "inventory.negative_stock_allowed", enabled: true, limit: null },
    { key: "pricing.price_lists", enabled: true, limit: null },
    { key: "pricing.promotions_basic", enabled: true, limit: null },
    { key: "pricing.promotions_advanced", enabled: true, limit: null },
    { key: "limits.products.max", enabled: true, limit: null },
    { key: "limits.monthly_sales.max", enabled: true, limit: null },
    { key: "limits.locations.max", enabled: true, limit: null },
    { key: "limits.registers.max", enabled: true, limit: null },
    { key: "limits.users.max", enabled: true, limit: null },
    { key: "limits.price_lists.max", enabled: true, limit: null },
  ]);

  await prisma.location.upsert({
    where: {
      tenantId_code: {
        tenantId: SEED_TENANT_ID,
        code: "MAIN",
      },
    },
    update: {
      name: "Ubicacion principal",
      isActive: true,
    },
    create: {
      id: SEED_POS_LOCATION_ID,
      tenantId: SEED_TENANT_ID,
      code: "MAIN",
      name: "Ubicacion principal",
      isActive: true,
    },
  });

  const current = await prisma.subscription.findFirst({
    where: {
      tenantId: SEED_TENANT_ID,
      isCurrent: true,
    },
  });

  if (!current) {
    await prisma.subscription.create({
      data: {
        id: SEED_POS_SUBSCRIPTION_ID,
        tenantId: SEED_TENANT_ID,
        planId: free.id,
        status: "ACTIVE",
        isCurrent: true,
      },
    });
  }

  console.log("POS billing seed: plans, features, limits and location");
}
