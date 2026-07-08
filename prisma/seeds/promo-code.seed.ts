import { PrismaClient } from "@prisma/client";

export async function seedPromoCodes(prisma: PrismaClient) {
  const expiresNextYear = new Date();
  expiresNextYear.setFullYear(expiresNextYear.getFullYear() + 1);

  const expiredLastMonth = new Date();
  expiredLastMonth.setMonth(expiredLastMonth.getMonth() - 1);

  await prisma.promoCode.upsert({
    where: { code: "SAVE10" },
    update: {
      discountPercent: 10,
      appliesToInterval: "MONTH",
      expiryDate: expiresNextYear,
      isActive: true,
    },
    create: {
      code: "SAVE10",
      discountPercent: 10,
      appliesToInterval: "MONTH",
      expiryDate: expiresNextYear,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "LAUNCH20" },
    update: {
      discountPercent: 20,
      appliesToInterval: "YEAR",
      expiryDate: expiresNextYear,
      isActive: true,
    },
    create: {
      code: "LAUNCH20",
      discountPercent: 20,
      appliesToInterval: "YEAR",
      expiryDate: expiresNextYear,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "EXPIRED50" },
    update: {
      discountPercent: 50,
      appliesToInterval: "MONTH",
      expiryDate: expiredLastMonth,
      isActive: true,
    },
    create: {
      code: "EXPIRED50",
      discountPercent: 50,
      appliesToInterval: "MONTH",
      expiryDate: expiredLastMonth,
      isActive: true,
    },
  });

  console.log("Promo codes seeded: SAVE10, LAUNCH20, EXPIRED50");
}
