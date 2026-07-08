import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const authRepository = {
  async getOrCreateUserProfile(userId: string) {
    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return prisma.userProfile.create({
      data: { userId },
    });
  },

  async markOnboardingCompleted(userId: string) {
    return prisma.userProfile.upsert({
      where: { userId },
      update: { onboardingCompleted: true },
      create: {
        userId,
        onboardingCompleted: true,
      },
    });
  },

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
