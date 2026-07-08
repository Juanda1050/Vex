import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPaginationMeta } from "@/server/pagination";
import type {
  ConvertQuoteToSaleInput,
  CreateQuoteInput,
  QuoteFilters,
  QuoteItemInput,
} from "../types/quote.types";

const DOC_TYPE_QUOTE = "QUOTE" as const;
const DOC_TYPE_SALE = "SALE" as const;

function quoteItemAmounts(item: QuoteItemInput) {
  const quantity = new Prisma.Decimal(item.quantity);
  const unitPrice = new Prisma.Decimal(item.unitPrice);
  const discount = new Prisma.Decimal(item.discount ?? 0);
  const taxRate = new Prisma.Decimal(item.taxRate ?? 0);

  const gross = quantity.mul(unitPrice);
  const discountAmount = gross.mul(discount).div(100);
  const taxableBase = gross.sub(discountAmount);
  const taxAmount = taxableBase.mul(taxRate).div(100);
  const subtotal = taxableBase.add(taxAmount);

  return {
    quantity,
    unitPrice,
    discount,
    taxRate,
    subtotal,
    taxableBase,
    taxAmount,
  };
}

export class QuoteRepository {
  private async ensureProductIdsBelongToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productIds: string[],
  ) {
    if (productIds.length === 0) return;

    const products = await tx.product.findMany({
      where: {
        tenantId,
        id: { in: productIds },
      },
      select: { id: true },
    });

    const existingProductIds = new Set(products.map((product) => product.id));
    const hasMissingProduct = productIds.some(
      (productId) => !existingProductIds.has(productId),
    );

    if (hasMissingProduct) {
      throw new Error("Producto no encontrado para el tenant actual.");
    }
  }

  private async ensureVariantIdsBelongToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    variantIds: string[],
  ) {
    if (variantIds.length === 0) return;

    const variants = await tx.productVariant.findMany({
      where: {
        tenantId,
        id: { in: variantIds },
      },
      select: { id: true },
    });

    const existingVariantIds = new Set(variants.map((variant) => variant.id));
    const hasMissingVariant = variantIds.some(
      (variantId) => !existingVariantIds.has(variantId),
    );

    if (hasMissingVariant) {
      throw new Error("Variante no encontrada para el tenant actual.");
    }
  }

  private async ensureBranchBelongsToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    branchId: string,
  ) {
    const branch = await tx.branch.findFirst({
      where: { id: branchId, tenantId },
      select: { id: true },
    });

    if (!branch) {
      throw new Error("Sucursal no encontrada para el tenant actual.");
    }
  }

  private async ensureCustomerBelongsToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    customerId: string,
  ) {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { id: true },
    });

    if (!customer) {
      throw new Error("Cliente no encontrado para el tenant actual.");
    }
  }

  private async ensureWarehouseBelongsToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    warehouseId: string,
  ) {
    const warehouse = await tx.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
      select: { id: true },
    });

    if (!warehouse) {
      throw new Error("Almacen no encontrado para el tenant actual.");
    }
  }

  private async ensureItemResourcesBelongToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    items: QuoteItemInput[],
  ) {
    const productIds = Array.from(
      new Set(
        items
          .map((item) => item.productId)
          .filter((productId): productId is string => Boolean(productId)),
      ),
    );

    const variantIds = Array.from(
      new Set(
        items
          .map((item) => item.variantId)
          .filter((variantId): variantId is string => Boolean(variantId)),
      ),
    );

    await Promise.all([
      this.ensureProductIdsBelongToTenant(tx, tenantId, productIds),
      this.ensureVariantIdsBelongToTenant(tx, tenantId, variantIds),
    ]);
  }

  private async nextDocumentNumberTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    type: "QUOTE" | "SALE",
  ) {
    const defaults =
      type === DOC_TYPE_QUOTE
        ? { prefix: "QTE-", nextNumber: 1 }
        : { prefix: "SAL-", nextNumber: 1 };

    const txModels = tx as unknown as Record<string, unknown>;
    const documentCounter = txModels["documentCounter"] as {
      upsert: (
        args: unknown,
      ) => Promise<{ nextNumber: number; prefix: string }>;
      update: (args: unknown) => Promise<unknown>;
    };

    const counter = await documentCounter.upsert({
      where: {
        tenantId_type: {
          tenantId,
          type,
        },
      },
      create: {
        tenantId,
        type,
        prefix: defaults.prefix,
        nextNumber: defaults.nextNumber,
      },
      update: {},
    });

    const current = counter.nextNumber;

    await documentCounter.update({
      where: {
        tenantId_type: {
          tenantId,
          type,
        },
      },
      data: {
        nextNumber: { increment: 1 },
      },
    });

    const padded = String(current).padStart(6, "0");
    return `${counter.prefix}${padded}`;
  }

  async createQuote(input: CreateQuoteInput) {
    return prisma.$transaction(async (tx) => {
      await this.ensureBranchBelongsToTenant(
        tx,
        input.tenantId,
        input.branchId,
      );

      if (input.customerId) {
        await this.ensureCustomerBelongsToTenant(
          tx,
          input.tenantId,
          input.customerId,
        );
      }

      await this.ensureItemResourcesBelongToTenant(
        tx,
        input.tenantId,
        input.items,
      );

      const number = await this.nextDocumentNumberTx(
        tx,
        input.tenantId,
        DOC_TYPE_QUOTE,
      );

      const computedItems = input.items.map((item) => {
        const amounts = quoteItemAmounts(item);
        return {
          ...item,
          ...amounts,
        };
      });

      const subtotal = computedItems.reduce(
        (acc, row) => acc.add(row.taxableBase),
        new Prisma.Decimal(0),
      );
      const taxAmount = computedItems.reduce(
        (acc, row) => acc.add(row.taxAmount),
        new Prisma.Decimal(0),
      );
      const total = computedItems.reduce(
        (acc, row) => acc.add(row.subtotal),
        new Prisma.Decimal(0),
      );

      const quote = await tx.quote.create({
        data: {
          tenantId: input.tenantId,
          customerId: input.customerId,
          branchId: input.branchId,
          number,
          status: "DRAFT",
          notes: input.notes,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          createdBy: input.createdBy,
          subtotal,
          taxAmount,
          total,
          items: {
            create: computedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return quote;
    });
  }

  async findById(tenantId: string, quoteId: string) {
    return prisma.quote.findFirst({
      where: {
        id: quoteId,
        tenantId,
      },
      include: {
        items: true,
      },
    });
  }

  async listQuotes(tenantId: string, filters: QuoteFilters) {
    const where = {
      tenantId,
      status: filters.status,
      customerId: filters.customerId,
      branchId: filters.branchId,
      OR: filters.search
        ? [
            {
              number: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              notes: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              customer: {
                name: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ]
        : undefined,
    };

    const skip = (filters.page - 1) * filters.pageSize;

    const [total, items] = await prisma.$transaction([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: filters.pageSize,
      }),
    ]);

    return {
      items,
      pagination: createPaginationMeta(filters.page, filters.pageSize, total),
    };
  }

  async deleteQuote(tenantId: string, quoteId: string) {
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        tenantId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!quote) {
      throw new Error("Cotizacion no encontrada.");
    }

    if (quote.status !== "DRAFT") {
      throw new Error("Solo se pueden eliminar cotizaciones en borrador.");
    }

    await prisma.quote.delete({
      where: { id: quote.id },
    });
  }

  async convertToSale(input: ConvertQuoteToSaleInput) {
    return prisma.$transaction(async (tx) => {
      await this.ensureWarehouseBelongsToTenant(
        tx,
        input.tenantId,
        input.warehouseId,
      );

      const quote = await tx.quote.findFirst({
        where: {
          id: input.quoteId,
          tenantId: input.tenantId,
        },
        include: {
          items: true,
        },
      });

      if (!quote) throw new Error("Cotizacion no encontrada.");
      if (quote.status === "CONVERTED") {
        throw new Error("La cotizacion ya fue convertida previamente.");
      }
      if (quote.status !== "ACCEPTED") {
        throw new Error("Solo las cotizaciones aceptadas pueden convertirse.");
      }

      if (quote.customerId) {
        await this.ensureCustomerBelongsToTenant(
          tx,
          input.tenantId,
          quote.customerId,
        );
      }

      await this.ensureBranchBelongsToTenant(
        tx,
        input.tenantId,
        quote.branchId,
      );

      const saleNumber = await this.nextDocumentNumberTx(
        tx,
        input.tenantId,
        DOC_TYPE_SALE,
      );

      const sale = await tx.sale.create({
        data: {
          tenantId: input.tenantId,
          customerId: quote.customerId,
          branchId: quote.branchId,
          warehouseId: input.warehouseId,
          quoteId: quote.id,
          number: saleNumber,
          status: "CONFIRMED",
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          total: quote.total,
          amountPaid: 0,
          createdBy: input.createdBy,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      const stockRequirements = new Map<
        string,
        {
          productId: string | null;
          variantId: string | null;
          quantity: Prisma.Decimal;
        }
      >();

      for (const item of quote.items) {
        if (!item.productId && !item.variantId) continue;

        const key = item.productId
          ? `product:${item.productId}`
          : `variant:${item.variantId}`;

        const existing = stockRequirements.get(key);
        if (existing) {
          existing.quantity = existing.quantity.add(item.quantity);
          continue;
        }

        stockRequirements.set(key, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: new Prisma.Decimal(item.quantity),
        });
      }

      const requirements = Array.from(stockRequirements.values());
      const productIds = requirements
        .map((item) => item.productId)
        .filter((productId): productId is string => Boolean(productId));
      const variantIds = requirements
        .map((item) => item.variantId)
        .filter((variantId): variantId is string => Boolean(variantId));

      await Promise.all([
        this.ensureProductIdsBelongToTenant(tx, input.tenantId, productIds),
        this.ensureVariantIdsBelongToTenant(tx, input.tenantId, variantIds),
      ]);

      const [productInventoryRows, variantInventoryRows] = await Promise.all([
        productIds.length > 0
          ? tx.inventory.findMany({
              where: {
                warehouseId: input.warehouseId,
                productId: { in: productIds },
              },
              select: {
                id: true,
                productId: true,
                quantityOnHand: true,
              },
            })
          : Promise.resolve([]),
        variantIds.length > 0
          ? tx.inventory.findMany({
              where: {
                warehouseId: input.warehouseId,
                variantId: { in: variantIds },
              },
              select: {
                id: true,
                variantId: true,
                quantityOnHand: true,
              },
            })
          : Promise.resolve([]),
      ]);

      const inventoryByKey = new Map<
        string,
        { id: string; quantityOnHand: Prisma.Decimal }
      >();

      for (const row of productInventoryRows) {
        if (!row.productId) continue;
        inventoryByKey.set(`product:${row.productId}`, {
          id: row.id,
          quantityOnHand: row.quantityOnHand,
        });
      }

      for (const row of variantInventoryRows) {
        if (!row.variantId) continue;
        inventoryByKey.set(`variant:${row.variantId}`, {
          id: row.id,
          quantityOnHand: row.quantityOnHand,
        });
      }

      const inventoryUpdates: Array<Promise<unknown>> = [];
      for (const requirement of requirements) {
        const key = requirement.productId
          ? `product:${requirement.productId}`
          : `variant:${requirement.variantId}`;
        const current = inventoryByKey.get(key);

        if (!current || current.quantityOnHand.lt(requirement.quantity)) {
          throw new Error("Stock insuficiente para convertir la cotizacion.");
        }

        inventoryUpdates.push(
          tx.inventory.update({
            where: { id: current.id },
            data: {
              quantityOnHand: current.quantityOnHand.sub(requirement.quantity),
            },
          }),
        );
      }

      if (inventoryUpdates.length > 0) {
        await Promise.all(inventoryUpdates);
      }

      const movementRows = quote.items
        .filter((item) => item.productId || item.variantId)
        .map((item) => ({
          tenantId: input.tenantId,
          warehouseId: input.warehouseId,
          productId: item.productId,
          variantId: item.variantId,
          type: "SALE_OUT" as const,
          quantity: item.quantity,
          referenceId: sale.id,
          notes: `Salida por conversion de cotizacion ${quote.number}`,
          createdBy: input.createdBy,
        }));

      if (movementRows.length > 0) {
        await tx.stockMovement.createMany({ data: movementRows });
      }

      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: "CONVERTED",
          convertedToSaleId: sale.id,
        },
      });

      return sale;
    });
  }
}

export const quoteRepository = new QuoteRepository();
