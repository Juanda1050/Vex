import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ConvertQuoteToSaleInput,
  CreateQuoteInput,
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
  private async nextDocumentNumberTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    type: "QUOTE" | "SALE",
  ) {
    const defaults =
      type === DOC_TYPE_QUOTE
        ? { prefix: "QTE-", nextNumber: 1 }
        : { prefix: "SAL-", nextNumber: 1 };

    const counter = await tx.documentCounter.upsert({
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

    await tx.documentCounter.update({
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

  async convertToSale(input: ConvertQuoteToSaleInput) {
    return prisma.$transaction(async (tx) => {
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
