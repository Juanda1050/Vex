-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'INCOMPLETE', 'PAUSED');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('INTERNAL', 'STRIPE');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" "PlanTier" NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_prices" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "nickname" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" "BillingInterval" NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "provider" "BillingProvider" NOT NULL DEFAULT 'INTERNAL',
    "providerPriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "priceId" UUID,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "provider" "BillingProvider" NOT NULL DEFAULT 'INTERNAL',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "subscription_plans_isPublic_isActive_idx" ON "subscription_plans"("isPublic", "isActive");

-- CreateIndex
CREATE INDEX "subscription_plans_tier_isActive_idx" ON "subscription_plans"("tier", "isActive");

-- CreateIndex
CREATE INDEX "subscription_prices_planId_isActive_idx" ON "subscription_prices"("planId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_prices_provider_providerPriceId_key" ON "subscription_prices"("provider", "providerPriceId");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenantId_isCurrent_idx" ON "tenant_subscriptions"("tenantId", "isCurrent");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenantId_status_idx" ON "tenant_subscriptions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_planId_idx" ON "tenant_subscriptions"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscriptions_provider_providerSubscriptionId_key" ON "tenant_subscriptions"("provider", "providerSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_events_subscriptionId_createdAt_idx" ON "subscription_events"("subscriptionId", "createdAt");

-- AddForeignKey
ALTER TABLE "subscription_prices" ADD CONSTRAINT "subscription_prices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "subscription_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "tenant_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
