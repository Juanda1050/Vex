import { PrismaClient } from "@prisma/client";
import { seedTenant } from "./seeds/tenant.seed";
import { seedSettings } from "./seeds/settings.seed";
import { seedBranch } from "./seeds/branch.seed";
import { seedWarehouse } from "./seeds/warehouse.seed";
import { seedUnits } from "./seeds/unit.seed";
import { seedCategories } from "./seeds/category.seed";
import { seedBrands } from "./seeds/brand.seed";
import {
  seedSubscriptionCatalog,
  seedTenantSubscription,
} from "./seeds/subscription.seed";
import { seedPromoCodes } from "./seeds/promo-code.seed";
import { seedPosBilling } from "./seeds/pos-billing.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("\nIniciando seed...\n");

  await seedTenant(prisma);
  await seedSubscriptionCatalog(prisma);
  await seedTenantSubscription(prisma);
  await seedPosBilling(prisma);
  await seedPromoCodes(prisma);
  await seedSettings(prisma);
  await seedBranch(prisma);
  await seedWarehouse(prisma);
  await seedUnits(prisma);
  await seedCategories(prisma);
  await seedBrands(prisma);

  console.log("\nSeed completado exitosamente.\n");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
