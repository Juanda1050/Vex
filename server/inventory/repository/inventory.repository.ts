import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPaginationMeta } from "@/server/pagination";
import type {
  InventoryFilters,
  RegisterStockMovementInput,
} from "../types/inventory.types";

const OUTGOING_TYPES = new Set([
  "SALE_OUT",
  "ADJUSTMENT_OUT",
  "TRANSFER_OUT",
  "RETURN_OUT",
]);

export class InventoryRepository {
  async countActiveWarehousesByTenant(tenantId: string) {
    return prisma.warehouse.count({
      where: {
        tenantId,
        isActive: true,
      },
    });
  }

  async listInventory(tenantId: string, filters: InventoryFilters) {
    const skip = (filters.page - 1) * filters.pageSize;

    const baseWhere = {
      tenantId,
      warehouseId: filters.warehouseId,
      productId: filters.productId,
      variantId: filters.variantId,
    };

    if (!filters.lowStockOnly) {
      const [total, items] = await prisma.$transaction([
        prisma.inventory.count({ where: baseWhere }),
        prisma.inventory.findMany({
          where: baseWhere,
          include: {
            warehouse: true,
            product: true,
            variant: true,
          },
          orderBy: [{ updatedAt: "desc" }],
          skip,
          take: filters.pageSize,
        }),
      ]);

      return {
        items,
        pagination: createPaginationMeta(filters.page, filters.pageSize, total),
      };
    }

    const sqlConditions: Prisma.Sql[] = [
      Prisma.sql`i."tenantId" = ${tenantId}::uuid`,
    ];

    if (filters.warehouseId) {
      sqlConditions.push(
        Prisma.sql`i."warehouseId" = ${filters.warehouseId}::uuid`,
      );
    }

    if (filters.productId) {
      sqlConditions.push(
        Prisma.sql`i."productId" = ${filters.productId}::uuid`,
      );
    }

    if (filters.variantId) {
      sqlConditions.push(
        Prisma.sql`i."variantId" = ${filters.variantId}::uuid`,
      );
    }

    const whereClause = Prisma.join(sqlConditions, " AND ");

    const [countRows, lowStockIdRows] = await Promise.all([
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM inventory i
        WHERE ${whereClause}
          AND i."quantityOnHand" <= i."minStock"
      `,
      prisma.$queryRaw<Array<{ id: string }>>`
        SELECT i.id
        FROM inventory i
        WHERE ${whereClause}
          AND i."quantityOnHand" <= i."minStock"
        ORDER BY i."updatedAt" DESC
        LIMIT ${filters.pageSize}
        OFFSET ${skip}
      `,
    ]);

    const lowStockIds = lowStockIdRows.map((row) => row.id);
    if (lowStockIds.length === 0) {
      return {
        items: [],
        pagination: createPaginationMeta(
          filters.page,
          filters.pageSize,
          countRows[0]?.count ?? 0,
        ),
      };
    }

    const rows = await prisma.inventory.findMany({
      where: { id: { in: lowStockIds } },
      include: {
        warehouse: true,
        product: true,
        variant: true,
      },
    });

    const rowById = new Map(rows.map((row) => [row.id, row]));
    const items = lowStockIds
      .map((id) => rowById.get(id))
      .filter((row): row is (typeof rows)[number] => Boolean(row));

    return {
      items,
      pagination: createPaginationMeta(
        filters.page,
        filters.pageSize,
        countRows[0]?.count ?? 0,
      ),
    };
  }

  async registerMovement(input: RegisterStockMovementInput) {
    const quantity = new Prisma.Decimal(input.quantity);
    const delta = OUTGOING_TYPES.has(input.type)
      ? quantity.negated()
      : quantity;

    return prisma.$transaction(async (tx) => {
      const [warehouse, product, variant] = await Promise.all([
        tx.warehouse.findFirst({
          where: { id: input.warehouseId, tenantId: input.tenantId },
          select: { id: true },
        }),
        input.productId
          ? tx.product.findFirst({
              where: { id: input.productId, tenantId: input.tenantId },
              select: { id: true },
            })
          : Promise.resolve(null),
        input.variantId
          ? tx.productVariant.findFirst({
              where: { id: input.variantId, tenantId: input.tenantId },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

      if (!warehouse) {
        throw new Error("Almacen no encontrado para el tenant actual.");
      }

      if (input.productId && !product) {
        throw new Error("Producto no encontrado para el tenant actual.");
      }

      if (input.variantId && !variant) {
        throw new Error("Variante no encontrada para el tenant actual.");
      }

      const whereUnique = input.productId
        ? {
            warehouseId_productId: {
              warehouseId: input.warehouseId,
              productId: input.productId,
            },
          }
        : {
            warehouseId_variantId: {
              warehouseId: input.warehouseId,
              variantId: input.variantId!,
            },
          };

      const current = await tx.inventory.findUnique({ where: whereUnique });

      const nextQuantity = (
        current?.quantityOnHand ?? new Prisma.Decimal(0)
      ).add(delta);

      if (nextQuantity.lt(0)) {
        throw new Error("Stock insuficiente para completar el movimiento.");
      }

      const inventory = await tx.inventory.upsert({
        where: whereUnique,
        create: {
          tenantId: input.tenantId,
          warehouseId: input.warehouseId,
          productId: input.productId,
          variantId: input.variantId,
          quantityOnHand: nextQuantity,
          minStock: current?.minStock ?? 0,
          maxStock: current?.maxStock ?? 0,
        },
        update: {
          quantityOnHand: nextQuantity,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          tenantId: input.tenantId,
          warehouseId: input.warehouseId,
          productId: input.productId,
          variantId: input.variantId,
          quantity,
          type: input.type,
          referenceId: input.referenceId,
          notes: input.notes,
          createdBy: input.createdBy,
        },
      });

      return { inventory, movement };
    });
  }

  async kardexByProduct(data: {
    tenantId: string;
    warehouseId?: string;
    productId?: string;
    variantId?: string;
  }) {
    return prisma.stockMovement.findMany({
      where: {
        tenantId: data.tenantId,
        warehouseId: data.warehouseId,
        productId: data.productId,
        variantId: data.variantId,
      },
      orderBy: [{ createdAt: "asc" }],
    });
  }
}

export const inventoryRepository = new InventoryRepository();
