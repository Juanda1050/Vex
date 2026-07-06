import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const authRepository = {
  async findMemberByUserId(userId: string) {
    return prisma.tenantMember.findFirst({
      where: { userId },
      include: {
        tenant: {
          include: {
            branches: {
              where: { isActive: true },
              include: {
                warehouses: {
                  where: { isDefault: true },
                  take: 1,
                },
              },
              take: 1,
            },
            subscriptions: {
              where: { isCurrent: true },
              include: {
                plan: {
                  select: {
                    code: true,
                    tier: true,
                  },
                },
              },
              orderBy: {
                startedAt: "desc",
              },
              take: 1,
            },
          },
        },
        branch: {
          include: {
            warehouses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
      },
    });
  },

  async findBranchById(branchId: string, tenantId: string) {
    return prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      include: {
        warehouses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });
  },

  async listRolePermissions(tenantId: string, role: UserRole) {
    return prisma.tenantRolePermission.findMany({
      where: {
        tenantId,
        role,
      },
      orderBy: [{ permission: "asc" }],
    });
  },
};

export type TenantMember = NonNullable<
  Awaited<ReturnType<typeof authRepository.findMemberByUserId>>
>;
