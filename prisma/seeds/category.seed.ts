import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, generateSeedId } from "./constants";

const CATEGORIES = [
  "Papelería",
  "Oficina",
  "Limpieza",
  "Electrónica",
  "Consumibles",
  "Mobiliario",
  "Herramientas",
  "Otros",
];

export async function seedCategories(prisma: PrismaClient) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const id = generateSeedId(2, i + 1);
    await prisma.category.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenantId: SEED_TENANT_ID,
        name: CATEGORIES[i],
        isActive: true,
      },
    });
  }
  console.log(`✅ Categories: ${CATEGORIES.length} procesadas.`);
}
