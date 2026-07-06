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
  async listInventory(tenantId: string, filters: InventoryFilters) {
    const rows = await prisma.inventory.findMany({
      where: {
        tenantId,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        variantId: filters.variantId,
      },
      include: {
        warehouse: true,
        product: true,
        variant: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    const filteredRows = filters.lowStockOnly
      ? rows.filter((row) => row.quantityOnHand.lte(row.minStock))
      : rows;

    const skip = (filters.page - 1) * filters.pageSize;
    const items = filteredRows.slice(skip, skip + filters.pageSize);

    return {
      items,
      pagination: createPaginationMeta(
        filters.page,
        filters.pageSize,
        filteredRows.length,
      ),
    };
  }

  async registerMovement(input: RegisterStockMovementInput) {
    const quantity = new Prisma.Decimal(input.quantity);
    const delta = OUTGOING_TYPES.has(input.type)
      ? quantity.negated()
      : quantity;

    return prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.findFirst({
        where: { id: input.warehouseId, tenantId: input.tenantId },
        select: { id: true },
      });

      if (!warehouse) {
        throw new Error("Almacen no encontrado para el tenant actual.");
      }

      if (input.productId) {
        const product = await tx.product.findFirst({
          where: { id: input.productId, tenantId: input.tenantId },
          select: { id: true },
        });

        if (!product) {
          throw new Error("Producto no encontrado para el tenant actual.");
        }
      }

      if (input.variantId) {
        const variant = await tx.productVariant.findFirst({
          where: { id: input.variantId, tenantId: input.tenantId },
          select: { id: true },
        });

        if (!variant) {
          throw new Error("Variante no encontrada para el tenant actual.");
        }
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
