import { prisma } from "@/lib/prisma";
import { FREE_PLAN_CODE } from "@/server/subscriptions";
import {
  DEFAULT_MAIN_BRANCH_NAME,
  DEFAULT_MAIN_WAREHOUSE_NAME,
  TENANT_BRAND_DEFAULTS,
} from "../constants/tenant.constants";
import type {
  RegisterTenantInput,
  SetRolePermissionInput,
  UpdateTenantBrandingInput,
} from "../types/tenant.types";

export class TenantRepository {
  async createWithInitialSetup(data: RegisterTenantInput) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          brandPrimary: TENANT_BRAND_DEFAULTS.brandPrimary,
          brandSecondary: TENANT_BRAND_DEFAULTS.brandSecondary,
          documentCounters: {
            create: [
              { type: "QUOTE", prefix: "QTE-", nextNumber: 1 },
              { type: "SALE", prefix: "SAL-", nextNumber: 1 },
              { type: "PURCHASE", prefix: "PO-", nextNumber: 1 },
            ],
          },
          settings: { create: {} },
          branches: {
            create: {
              name: DEFAULT_MAIN_BRANCH_NAME,
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
            name: DEFAULT_MAIN_WAREHOUSE_NAME,
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

  async findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  }

  async updateBranding(input: UpdateTenantBrandingInput) {
    return prisma.tenant.update({
      where: { id: input.tenantId },
      data: {
        logoUrl: input.logoUrl,
        brandPrimary: input.brandPrimary,
        brandSecondary: input.brandSecondary,
        address: input.address,
        phone: input.phone,
      },
    });
  }

  async upsertRolePermission(input: SetRolePermissionInput) {
    return prisma.tenantRolePermission.upsert({
      where: {
        tenantId_role_permission: {
          tenantId: input.tenantId,
          role: input.role,
          permission: input.permission,
        },
      },
      create: {
        tenantId: input.tenantId,
        role: input.role,
        permission: input.permission,
        isAllowed: input.isAllowed,
      },
      update: {
        isAllowed: input.isAllowed,
      },
    });
  }

  async listRolePermissions(tenantId: string) {
    return prisma.tenantRolePermission.findMany({
      where: { tenantId },
      orderBy: [{ role: "asc" }, { permission: "asc" }],
    });
  }
}
