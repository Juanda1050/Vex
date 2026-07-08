import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { createPaginationMeta } from "@/server/pagination";
import type { CreateTenantUserInput, UserFilters } from "../types/user.types";

export class UserRepository {
  async countActiveUsersByTenant(tenantId: string) {
    return prisma.tenantMember.count({
      where: {
        tenantId,
        isActive: true,
      },
    });
  }

  async listUsers(tenantId: string, filters: UserFilters) {
    const where = {
      tenantId,
      isActive: filters.isActive,
      OR: filters.search
        ? [
            {
              userId: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              role: filters.search.toUpperCase() as UserRole,
            },
          ]
        : undefined,
    };

    const skip = (filters.page - 1) * filters.pageSize;

    const [total, items] = await prisma.$transaction([
      prisma.tenantMember.count({ where }),
      prisma.tenantMember.findMany({
        where,
        include: {
          userProfile: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { id: "asc" }],
        skip,
        take: filters.pageSize,
      }),
    ]);

    return {
      items,
      pagination: createPaginationMeta(filters.page, filters.pageSize, total),
    };
  }

  async createTenantUser(input: CreateTenantUserInput) {
    const existing = await prisma.tenantMember.findFirst({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
      },
      select: { id: true },
    });

    if (existing) {
      throw new Error("El usuario ya pertenece al tenant actual.");
    }

    if (input.branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: input.branchId,
          tenantId: input.tenantId,
        },
        select: { id: true },
      });

      if (!branch) {
        throw new Error("Sucursal no encontrada para el tenant actual.");
      }
    }

    return prisma.tenantMember.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        role: input.role,
        branchId: input.branchId ?? null,
        isActive: true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
