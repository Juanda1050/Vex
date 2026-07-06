import { prisma } from "@/lib/prisma";
import type {
  CreateProductInput,
  ProductFilters,
  UpdateProductInput,
} from "../types/product.types";

export class ProductRepository {
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

  async list(tenantId: string, filters: ProductFilters = {}) {
    return prisma.product.findMany({
      where: {
        tenantId,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        unitId: filters.unitId,
        isActive: filters.isActive,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              {
                internalCode: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              { sku: { contains: filters.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: [{ createdAt: "desc" }],
    });
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
}

export const productRepository = new ProductRepository();
