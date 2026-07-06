-- Align roles with auth module and add global-ready tenant configuration.

-- 1) Align UserRole enum values with existing auth roles.
CREATE TYPE "UserRole_new" AS ENUM (
  'OWNER',
  'ADMIN',
  'WAREHOUSE',
  'PURCHASING'
);

ALTER TABLE "tenant_members"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "tenant_members"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'MANAGER' THEN 'ADMIN'
      WHEN "role"::text = 'SUPERVISOR' THEN 'ADMIN'
      WHEN "role"::text = 'STAFF' THEN 'WAREHOUSE'
      WHEN "role"::text = 'CASHIER' THEN 'WAREHOUSE'
      ELSE "role"::text
    END
  )::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "tenant_members"
  ALTER COLUMN "role" SET DEFAULT 'WAREHOUSE';

-- 2) Add optional tenant metadata for broader business coverage.
ALTER TABLE "tenants"
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "countryCode" TEXT;

-- 3) Add tenant settings for global defaults and document labels.
ALTER TABLE "tenant_settings"
  ADD COLUMN "quoteLabel" TEXT NOT NULL DEFAULT 'Quote',
  ADD COLUMN "saleLabel" TEXT NOT NULL DEFAULT 'Sale',
  ADD COLUMN "purchaseLabel" TEXT NOT NULL DEFAULT 'Purchase',
  ADD COLUMN "defaultLocale" TEXT NOT NULL DEFAULT 'en';

ALTER TABLE "tenant_settings"
  ALTER COLUMN "currency" SET DEFAULT 'USD',
  ALTER COLUMN "taxRate" SET DEFAULT 0,
  ALTER COLUMN "taxName" SET DEFAULT 'Tax',
  ALTER COLUMN "quotePrefix" SET DEFAULT 'QTE-',
  ALTER COLUMN "salePrefix" SET DEFAULT 'SAL-',
  ALTER COLUMN "purchasePrefix" SET DEFAULT 'PO-',
  ALTER COLUMN "timezone" SET DEFAULT 'UTC';

-- 4) Allow optional branch scoping per member for auth consistency.
ALTER TABLE "tenant_members"
  ADD COLUMN "branchId" UUID;

CREATE INDEX "tenant_members_tenantId_branchId_idx"
  ON "tenant_members"("tenantId", "branchId");

ALTER TABLE "tenant_members"
  ADD CONSTRAINT "tenant_members_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 5) Add generic tax/legal fields while keeping legacy RFC fields.
ALTER TABLE "customers"
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "taxId" TEXT;

ALTER TABLE "suppliers"
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "taxId" TEXT;
