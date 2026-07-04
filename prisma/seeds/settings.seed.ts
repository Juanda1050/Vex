import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, SEED_SETTINGS_ID } from "./constants";

export async function seedSettings(prisma: PrismaClient) {
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: SEED_TENANT_ID },
    update: {},
    create: {
      id: SEED_SETTINGS_ID,
      tenantId: SEED_TENANT_ID,
      currency: "MXN",
      taxRate: 16,
      taxName: "IVA",
      quotePrefix: "COT-",
      salePrefix: "VTA-",
      purchasePrefix: "OC-",
      timezone: "America/Mexico_City",
    },
  });

  console.log(
    `✅ TenantSettings: ${settings.currency} / ${settings.taxName} ${settings.taxRate}%`,
  );
  return settings;
}
