import { prisma } from "@/lib/prisma";
import { createPaginationMeta } from "@/server/pagination";
import type {
  CreateProductInput,
  ProductFilters,
  UpdateProductInput,
} from "../types/product.types";

export class ProductRepository {
  async countActiveByTenant(tenantId: string) {
    return prisma.product.count({
      where: {
        tenantId,
        isActive: true,
      },
    });
  }

  async create(input: CreateProductInput) {
    return prisma.product.create({
      data: {
        tenantId: input.tenantId,
        categoryId: input.categoryId,
        brandId: input.brandId,
        unitId: input.unitId,
        name: input.name,
        description: input.description,
        internalCode: input.internalCode,
        sku: input.sku,
        hasVariants: input.hasVariants ?? false,
        basePrice: input.basePrice ?? 0,
        baseCost: input.baseCost ?? 0,
        isActive: input.isActive ?? true,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    return prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    });
  }

  async list(tenantId: string, filters: ProductFilters) {
    const where = {
      tenantId,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      unitId: filters.unitId,
      isActive: filters.isActive,
      OR: filters.search
        ? [
            {
              name: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              internalCode: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            { sku: { contains: filters.search, mode: "insensitive" as const } },
          ]
        : undefined,
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const dir = filters.dir ?? "desc";
    const orderBy =
      filters.sort === "name"
        ? [{ name: dir }]
        : filters.sort === "basePrice"
          ? [{ basePrice: dir }]
          : filters.sort === "baseCost"
            ? [{ baseCost: dir }]
            : [{ createdAt: "desc" as const }];

    const [total, items] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: filters.pageSize,
      }),
    ]);

    return {
      items,
      pagination: createPaginationMeta(filters.page, filters.pageSize, total),
    };
  }

  async update(input: UpdateProductInput) {
    return prisma.product.update({
      where: { id: input.id },
      data: {
        categoryId: input.categoryId,
        brandId: input.brandId,
        unitId: input.unitId,
        name: input.name,
        description: input.description,
        sku: input.sku,
        basePrice: input.basePrice,
        baseCost: input.baseCost,
        isActive: input.isActive,
      },
    });
  }

  async softDelete(tenantId: string, id: string) {
    return prisma.product.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }
}

export const productRepository = new ProductRepository();
