import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  async listInventory(tenantId: string, filters: InventoryFilters = {}) {
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

    if (!filters.lowStockOnly) return rows;

    return rows.filter((row) => row.quantityOnHand.lte(row.minStock));
  }

  async registerMovement(input: RegisterStockMovementInput) {
    const quantity = new Prisma.Decimal(input.quantity);
    const delta = OUTGOING_TYPES.has(input.type)
      ? quantity.negated()
      : quantity;

    return prisma.$transaction(async (tx) => {
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
