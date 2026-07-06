import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, SEED_SETTINGS_ID } from "./constants";

export async function seedSettings(prisma: PrismaClient) {
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: SEED_TENANT_ID },
    update: {},
    create: {
      id: SEED_SETTINGS_ID,
      tenantId: SEED_TENANT_ID,
      currency: "USD",
      taxRate: 0,
      taxName: "Tax",
      quotePrefix: "QTE-",
      salePrefix: "SAL-",
      purchasePrefix: "PO-",
      quoteLabel: "Quote",
      saleLabel: "Sale",
      purchaseLabel: "Purchase",
      defaultLocale: "en",
      timezone: "UTC",
    },
  });

  console.log(
    `✅ TenantSettings: ${settings.currency} / ${settings.taxName} ${settings.taxRate}%`,
  );
  return settings;
}
