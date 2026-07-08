import { PrismaClient } from "@prisma/client";
import {
  SEED_ENTERPRISE_PLAN_ID,
  SEED_ENTERPRISE_PRICE_MONTHLY_ID,
  SEED_ENTERPRISE_PRICE_YEARLY_ID,
  SEED_FREE_PLAN_ID,
  SEED_FREE_PRICE_MONTHLY_ID,
  SEED_PREMIUM_PLAN_ID,
  SEED_PREMIUM_PRICE_MONTHLY_ID,
  SEED_PREMIUM_PRICE_YEARLY_ID,
  SEED_TENANT_ID,
  SEED_TENANT_SUBSCRIPTION_ID,
} from "./constants";

export async function seedSubscriptionCatalog(prisma: PrismaClient) {
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { code: "FREE" },
    update: {
      name: "Free",
      description: "Plan gratuito para comenzar",
      tier: "FREE",
      isActive: true,
      isPublic: true,
      sortOrder: 0,
      features: {
        productsLimit: 100,
        usersLimit: 2,
        warehousesLimit: 1,
        reports: false,
        support: "community",
      },
    },
    create: {
      id: SEED_FREE_PLAN_ID,
      code: "FREE",
      name: "Free",
      description: "Plan gratuito para comenzar",
      tier: "FREE",
      isActive: true,
      isPublic: true,
      sortOrder: 0,
      features: {
        productsLimit: 100,
        usersLimit: 2,
        warehousesLimit: 1,
        reports: false,
        support: "community",
      },
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { code: "PREMIUM" },
    update: {
      name: "Premium",
      description: "Plan completo para empresas en crecimiento",
      tier: "PREMIUM",
      isActive: true,
      isPublic: true,
      sortOrder: 1,
      features: {
        productsLimit: null,
        usersLimit: null,
        warehousesLimit: null,
        reports: true,
        support: "priority",
      },
    },
    create: {
      id: SEED_PREMIUM_PLAN_ID,
      code: "PREMIUM",
      name: "Premium",
      description: "Plan completo para empresas en crecimiento",
      tier: "PREMIUM",
      isActive: true,
      isPublic: true,
      sortOrder: 1,
      features: {
        productsLimit: null,
        usersLimit: null,
        warehousesLimit: null,
        reports: true,
        support: "priority",
      },
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { code: "ENTERPRISE" },
    update: {
      name: "Enterprise",
      description: "Plan personalizado para operación avanzada",
      tier: "ENTERPRISE",
      isActive: true,
      isPublic: true,
      sortOrder: 2,
      features: {
        productsLimit: null,
        usersLimit: null,
        warehousesLimit: null,
        reports: true,
        support: "dedicated",
        sso: true,
      },
    },
    create: {
      id: SEED_ENTERPRISE_PLAN_ID,
      code: "ENTERPRISE",
      name: "Enterprise",
      description: "Plan personalizado para operación avanzada",
      tier: "ENTERPRISE",
      isActive: true,
      isPublic: true,
      sortOrder: 2,
      features: {
        productsLimit: null,
        usersLimit: null,
        warehousesLimit: null,
        reports: true,
        support: "dedicated",
        sso: true,
      },
    },
  });

  await prisma.subscriptionPrice.upsert({
    where: {
      provider_providerPriceId: {
        provider: "INTERNAL",
        providerPriceId: "internal-free-monthly",
      },
    },
    update: {
      planId: freePlan.id,
      nickname: "Free Monthly",
      amount: 0,
      currency: "USD",
      interval: "MONTH",
      intervalCount: 1,
      trialDays: null,
      isActive: true,
    },
    create: {
      id: SEED_FREE_PRICE_MONTHLY_ID,
      planId: freePlan.id,
      nickname: "Free Monthly",
      amount: 0,
      currency: "USD",
      interval: "MONTH",
      intervalCount: 1,
      trialDays: null,
      isActive: true,
      provider: "INTERNAL",
      providerPriceId: "internal-free-monthly",
    },
  });

  await prisma.subscriptionPrice.upsert({
    where: {
      provider_providerPriceId: {
        provider: "INTERNAL",
        providerPriceId: "internal-premium-monthly",
      },
    },
    update: {
      planId: premiumPlan.id,
      nickname: "Premium Monthly",
      amount: 29,
      currency: "USD",
      interval: "MONTH",
      intervalCount: 1,
      trialDays: 14,
      isActive: true,
    },
    create: {
      id: SEED_PREMIUM_PRICE_MONTHLY_ID,
      planId: premiumPlan.id,
      nickname: "Premium Monthly",
      amount: 29,
      currency: "USD",
      interval: "MONTH",
      intervalCount: 1,
      trialDays: 14,
      isActive: true,
      provider: "INTERNAL",
      providerPriceId: "internal-premium-monthly",
    },
  });

  await prisma.subscriptionPrice.upsert({
    where: {
      provider_providerPriceId: {
        provider: "INTERNAL",
        providerPriceId: "internal-premium-yearly",
      },
    },
    update: {
      planId: premiumPlan.id,
      nickname: "Premium Yearly",
      amount: 290,
      currency: "USD",
      interval: "YEAR",
      intervalCount: 1,
      trialDays: 14,
      isActive: true,
    },
    create: {
      id: SEED_PREMIUM_PRICE_YEARLY_ID,
      planId: premiumPlan.id,
      nickname: "Premium Yearly",
      amount: 290,
      currency: "USD",
      interval: "YEAR",
      intervalCount: 1,
      trialDays: 14,
      isActive: true,
      provider: "INTERNAL",
      providerPriceId: "internal-premium-yearly",
    },
  });

  await prisma.subscriptionPrice.upsert({
    where: {
      provider_providerPriceId: {
        provider: "INTERNAL",
        providerPriceId: "internal-enterprise-monthly",
      },
    },
    update: {
      planId: enterprisePlan.id,
      nickname: "Enterprise Monthly",
      amount: 99,
      currency: "USD",
      interval: "MONTH",
      intervalCount: 1,
      trialDays: null,
      isActive: true,
    },
    create: {
      id: SEED_ENTERPRISE_PRICE_MONTHLY_ID,
      planId: enterprisePlan.id,
      nickname: "Enterprise Monthly",
      amount: 99,
      currency: "USD",
      interval: "MONTH",
      intervalCount: 1,
      trialDays: null,
      isActive: true,
      provider: "INTERNAL",
      providerPriceId: "internal-enterprise-monthly",
    },
  });

  await prisma.subscriptionPrice.upsert({
    where: {
      provider_providerPriceId: {
        provider: "INTERNAL",
        providerPriceId: "internal-enterprise-yearly",
      },
    },
    update: {
      planId: enterprisePlan.id,
      nickname: "Enterprise Yearly",
      amount: 950,
      currency: "USD",
      interval: "YEAR",
      intervalCount: 1,
      trialDays: null,
      isActive: true,
    },
    create: {
      id: SEED_ENTERPRISE_PRICE_YEARLY_ID,
      planId: enterprisePlan.id,
      nickname: "Enterprise Yearly",
      amount: 950,
      currency: "USD",
      interval: "YEAR",
      intervalCount: 1,
      trialDays: null,
      isActive: true,
      provider: "INTERNAL",
      providerPriceId: "internal-enterprise-yearly",
    },
  });

  console.log("Subscription catalog: FREE, PREMIUM, ENTERPRISE");
}

export async function seedTenantSubscription(prisma: PrismaClient) {
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { code: "FREE" },
    include: {
      prices: {
        where: { isActive: true },
        orderBy: [{ amount: "asc" }, { intervalCount: "asc" }],
      },
    },
  });

  if (!freePlan) {
    throw new Error("No existe el plan FREE en el catálogo de suscripciones.");
  }

  const freePrice =
    freePlan.prices.find((price) => price.interval === "MONTH") ??
    freePlan.prices[0] ??
    null;

  const current = await prisma.tenantSubscription.findFirst({
    where: { tenantId: SEED_TENANT_ID, isCurrent: true },
  });

  if (!current) {
    const created = await prisma.tenantSubscription.create({
      data: {
        id: SEED_TENANT_SUBSCRIPTION_ID,
        tenantId: SEED_TENANT_ID,
        planId: freePlan.id,
        priceId: freePrice?.id,
        status: "ACTIVE",
        isCurrent: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      },
    });

    console.log(`Tenant subscription created: ${created.id}`);
    return created;
  }

  const updated = await prisma.tenantSubscription.update({
    where: { id: current.id },
    data: {
      planId: freePlan.id,
      priceId: freePrice?.id,
      status: "ACTIVE",
      isCurrent: true,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      endedAt: null,
    },
  });

  console.log(`Tenant subscription updated: ${updated.id}`);
  return updated;
}
