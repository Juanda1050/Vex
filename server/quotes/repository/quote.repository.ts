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
    for (const item of items) {
      if (item.productId) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
          select: { id: true },
        });

        if (!product) {
          throw new Error("Producto no encontrado para el tenant actual.");
        }
      }

      if (item.variantId) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, tenantId },
          select: { id: true },
        });

        if (!variant) {
          throw new Error("Variante no encontrada para el tenant actual.");
        }
      }
    }
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

      for (const item of quote.items) {
        if (!item.productId && !item.variantId) continue;

        if (item.productId) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, tenantId: input.tenantId },
            select: { id: true },
          });

          if (!product) {
            throw new Error("Producto no encontrado para el tenant actual.");
          }
        }

        if (item.variantId) {
          const variant = await tx.productVariant.findFirst({
            where: { id: item.variantId, tenantId: input.tenantId },
            select: { id: true },
          });

          if (!variant) {
            throw new Error("Variante no encontrada para el tenant actual.");
          }
        }

        const whereUnique = item.productId
          ? {
              warehouseId_productId: {
                warehouseId: input.warehouseId,
                productId: item.productId,
              },
            }
          : {
              warehouseId_variantId: {
                warehouseId: input.warehouseId,
                variantId: item.variantId!,
              },
            };

        const current = await tx.inventory.findUnique({ where: whereUnique });

        if (!current || current.quantityOnHand.lt(item.quantity)) {
          throw new Error("Stock insuficiente para convertir la cotizacion.");
        }

        await tx.inventory.update({
          where: { id: current.id },
          data: {
            quantityOnHand: current.quantityOnHand.sub(item.quantity),
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId: input.tenantId,
            warehouseId: input.warehouseId,
            productId: item.productId,
            variantId: item.variantId,
            type: "SALE_OUT",
            quantity: item.quantity,
            referenceId: sale.id,
            notes: `Salida por conversion de cotizacion ${quote.number}`,
            createdBy: input.createdBy,
          },
        });
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
