import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID } from "./constants";

export async function seedTenant(prisma: PrismaClient) {
  const tenant = await prisma.tenant.upsert({
    where: { id: SEED_TENANT_ID },
    update: {},
    create: {
      id: SEED_TENANT_ID,
      name: "Demo Company",
      slug: "demo-company",
      isActive: true,
    },
  });

  console.log(`Tenant: ${tenant.name}`);
  return tenant;
}
