import { prisma } from "@/lib/prisma";

export const authRepository = {
  async findMemberByUserId(userId: string) {
    return prisma.tenantUser.findFirst({
      where: { userId },
      include: {
        tenant: {
          include: {
            branches: {
              where: { isDefault: true },
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
};

export type TenantMember = NonNullable<
  Awaited<ReturnType<typeof authRepository.findMemberByUserId>>
>;
