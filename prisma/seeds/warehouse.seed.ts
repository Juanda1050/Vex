import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, SEED_BRANCH_ID, SEED_WAREHOUSE_ID } from "./constants";

export async function seedWarehouse(prisma: PrismaClient) {
  const warehouse = await prisma.warehouse.upsert({
    where: { id: SEED_WAREHOUSE_ID },
    update: {},
    create: {
      id: SEED_WAREHOUSE_ID,
      tenantId: SEED_TENANT_ID,
      branchId: SEED_BRANCH_ID,
      name: "Almacén Principal",
      isDefault: true,
      isActive: true,
    },
  });

  console.log(`Warehouse: ${warehouse.name}`);
  return warehouse;
}
