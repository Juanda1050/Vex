import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, generateSeedId } from "./constants";

const BRANDS = [
  "Genérica",
  "BIC",
  "Pilot",
  "Scribe",
  "Pelikan",
  "3M",
  "HP",
  "Epson",
  "Canon",
  "Apple",
];

export async function seedBrands(prisma: PrismaClient) {
  for (let i = 0; i < BRANDS.length; i++) {
    const id = generateSeedId(3, i + 1);
    await prisma.brand.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenantId: SEED_TENANT_ID,
        name: BRANDS[i],
        isActive: true,
      },
    });
  }
  console.log(`✅ Brands: ${BRANDS.length} procesadas.`);
}
