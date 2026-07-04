// prisma/seeds/unit.seed.ts
import { PrismaClient } from "@prisma/client";
import { SEED_TENANT_ID, generateSeedId } from "./constants";

const UNITS = [
  { name: "Pieza", abbr: "PZA" },
  { name: "Caja", abbr: "CJ" },
  { name: "Paquete", abbr: "PK" },
  { name: "Metro", abbr: "M" },
  { name: "Centímetro", abbr: "CM" },
  { name: "Kilogramo", abbr: "KG" },
  { name: "Gramo", abbr: "GR" },
  { name: "Litro", abbr: "LT" },
  { name: "Mililitro", abbr: "ML" },
  { name: "Unidad", abbr: "UND" },
];

export async function seedUnits(prisma: PrismaClient) {
  for (let i = 0; i < UNITS.length; i++) {
    const id = generateSeedId(1, i + 1);
    await prisma.unit.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenantId: SEED_TENANT_ID,
        name: UNITS[i].name,
        abbreviation: UNITS[i].abbr,
      },
    });
  }
  console.log(`✅ Units: ${UNITS.length} procesadas.`);
}
