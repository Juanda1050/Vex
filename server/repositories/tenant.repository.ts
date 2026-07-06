import { prisma } from "@/lib/prisma";
import { FREE_PLAN_CODE } from "../subscriptions";

export class TenantRepository {
  async createWithInitialSetup(data: {
    name: string;
    slug: string;
    ownerId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          settings: { create: {} },
          branches: {
            create: {
              name: "Sucursal Matriz",
            },
          },
          members: {
            create: {
              userId: data.ownerId,
              role: "OWNER",
            },
          },
        },
        include: {
          branches: {
            take: 1,
          },
        },
      });

      const mainBranch = tenant.branches[0];
      if (mainBranch) {
        await tx.warehouse.create({
          data: {
            tenantId: tenant.id,
            branchId: mainBranch.id,
            name: "Almacén Central",
            isDefault: true,
          },
        });
      }

      const freePlan = await tx.subscriptionPlan.findUnique({
        where: { code: FREE_PLAN_CODE },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: [{ amount: "asc" }, { intervalCount: "asc" }],
          },
        },
      });

      if (freePlan) {
        const freePrice =
          freePlan.prices.find((price) => price.interval === "MONTH") ??
          freePlan.prices[0] ??
          null;

        await tx.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: freePlan.id,
            priceId: freePrice?.id,
            status: "ACTIVE",
            isCurrent: true,
            currentPeriodStart: new Date(),
            currentPeriodEnd: null,
          },
        });
      }

      return tenant;
    });
  }
}
