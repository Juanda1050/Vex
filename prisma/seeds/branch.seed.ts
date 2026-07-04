// prisma/seeds/branch.seed.ts
import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, SEED_BRANCH_ID } from "./constants";

export async function seedBranch(prisma: PrismaClient) {
  const branch = await prisma.branch.upsert({
    where: { id: SEED_BRANCH_ID },
    update: {},
    create: {
      id: SEED_BRANCH_ID,
      tenantId: SEED_TENANT_ID,
      name: "Sucursal Principal",
      address: "Av. Principal #1, Ciudad de México",
      phone: "55 0000 0000",
      isActive: true,
    },
  });

  console.log(`Branch: ${branch.name}`);
  return branch;
}
