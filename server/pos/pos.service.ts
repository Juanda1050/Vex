import {
  CashMovementType,
  CashRegisterSessionStatus,
  InventoryMovementReason,
  PosPaymentMethod,
  Prisma,
  SaleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { invalidateTenantOperationalCaches } from "@/server/cache/tenant-cache-invalidation";
import { FEATURE_KEYS } from "@/server/plans";
import { getBillingFeaturesForTenant } from "@/server/plans/feature-flags";

type PaymentInput = {
  method: PosPaymentMethod;
  amount: number;
  reference?: string;
};

type CreateSaleInput = {
  tenantId: string;
  branchId: string;
  warehouseId: string;
  customerId?: string;
  notes?: string;
  createdBy?: string;
};

type AddSaleItemInput = {
  saleId: string;
  tenantId: string;
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
};

type CheckoutSaleInput = {
  saleId: string;
  tenantId: string;
  sessionId: string;
  locationId: string;
  clientTxnId: string;
  payments: PaymentInput[];
  createdBy?: string;
};

type RefundSaleInput = {
  saleId: string;
  tenantId: string;
  sessionId?: string;
  locationId: string;
  reason?: string;
  createdBy?: string;
  mode?: "refund" | "cancel";
};

function asDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

export class PosService {
  private async hasFeature(tenantId: string, featureKey: string) {
    const features = await getBillingFeaturesForTenant(tenantId);
    return features.features.some(
      (entry) => entry.key === featureKey && entry.enabled,
    );
  }

  private async isNegativeStockAllowed(tenantId: string) {
    return this.hasFeature(
      tenantId,
      FEATURE_KEYS.INVENTORY_NEGATIVE_STOCK_ALLOWED,
    );
  }

  async openRegister(input: {
    tenantId: string;
    userId: string;
    locationId: string;
    registerName: string;
    openingFloatAmount?: number;
    notes?: string;
  }) {
    const enabled = await this.hasFeature(
      input.tenantId,
      FEATURE_KEYS.POS_ENABLED,
    );
    if (!enabled) {
      throw new Error("POS no habilitado para el plan actual.");
    }

    const existingOpen = await prisma.cashRegisterSession.findFirst({
      where: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        registerName: input.registerName,
        status: CashRegisterSessionStatus.OPEN,
      },
      select: { id: true },
    });

    if (existingOpen) {
      throw new Error(
        "Ya existe una caja abierta con este nombre en la ubicacion.",
      );
    }

    const openCount = await prisma.cashRegisterSession.count({
      where: {
        tenantId: input.tenantId,
        status: CashRegisterSessionStatus.OPEN,
      },
    });

    const features = await getBillingFeaturesForTenant(input.tenantId);
    const registerLimit = features.features.find(
      (entry) => entry.key === "limits.registers.max",
    )?.limit;
    if (
      registerLimit !== null &&
      registerLimit !== undefined &&
      openCount >= registerLimit
    ) {
      throw new Error("Limite del plan alcanzado para limits.registers.max.");
    }

    const session = await prisma.cashRegisterSession.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        registerName: input.registerName,
        openedBy: input.userId,
        openingFloatAmount: input.openingFloatAmount ?? 0,
        notes: input.notes,
      },
    });

    if ((input.openingFloatAmount ?? 0) > 0) {
      await prisma.cashMovement.create({
        data: {
          tenantId: input.tenantId,
          sessionId: session.id,
          type: CashMovementType.OPENING_FLOAT,
          amount: asDecimal(input.openingFloatAmount ?? 0),
          notes: "Apertura de caja",
          createdBy: input.userId,
        },
      });
    }

    return session;
  }

  async closeRegister(input: {
    tenantId: string;
    userId: string;
    sessionId: string;
    closingAmount: number;
    notes?: string;
  }) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: {
        id: input.sessionId,
        tenantId: input.tenantId,
        status: CashRegisterSessionStatus.OPEN,
      },
    });

    if (!session) {
      throw new Error("Sesion de caja no encontrada o ya cerrada.");
    }

    const [summary] = await prisma.$queryRaw<Array<{ total: Prisma.Decimal }>>`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM cash_movements
      WHERE "tenantId" = ${input.tenantId}::uuid
        AND "sessionId" = ${input.sessionId}::uuid
    `;

    const expected = summary?.total ?? asDecimal(0);

    const updated = await prisma.cashRegisterSession.update({
      where: { id: input.sessionId },
      data: {
        status: CashRegisterSessionStatus.CLOSED,
        closedBy: input.userId,
        closedAt: new Date(),
        closingAmount: asDecimal(input.closingAmount),
        notes: input.notes,
      },
    });

    await prisma.cashMovement.create({
      data: {
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        type: CashMovementType.CLOSING_WITHDRAWAL,
        amount: asDecimal(input.closingAmount).negated(),
        notes: `Cierre de caja. Esperado ${expected.toString()}`,
        createdBy: input.userId,
      },
    });

    return updated;
  }

  async createSaleDraft(input: CreateSaleInput) {
    const enabled = await this.hasFeature(
      input.tenantId,
      FEATURE_KEYS.POS_ENABLED,
    );
    if (!enabled) {
      throw new Error("POS no habilitado para el plan actual.");
    }

    const number = `POS-${Date.now()}`;

    return prisma.sale.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        customerId: input.customerId,
        number,
        status: SaleStatus.PENDING,
        notes: input.notes,
        createdBy: input.createdBy,
      },
      include: {
        items: true,
      },
    });
  }

  private async resolveUnitPrice(tenantId: string, productId: string) {
    const now = new Date();

    const defaultList = await prisma.priceList.findFirst({
      where: {
        tenantId,
        isDefault: true,
        isActive: true,
      },
      select: { id: true },
    });

    if (defaultList) {
      const listPrice = await prisma.productPrice.findFirst({
        where: {
          tenantId,
          productId,
          priceListId: defaultList.id,
          validFrom: { lte: now },
          OR: [{ validTo: null }, { validTo: { gte: now } }],
        },
        orderBy: {
          validFrom: "desc",
        },
      });

      if (listPrice) {
        return Number(listPrice.price);
      }
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      select: {
        basePrice: true,
      },
    });

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    return Number(product.basePrice);
  }

  async addSaleItem(input: AddSaleItemInput) {
    const sale = await prisma.sale.findFirst({
      where: {
        id: input.saleId,
        tenantId: input.tenantId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!sale) {
      throw new Error("Venta no encontrada.");
    }

    if (sale.status !== SaleStatus.PENDING) {
      throw new Error("Solo se pueden agregar items a ventas pendientes.");
    }

    const [product, unitPrice] = await Promise.all([
      prisma.product.findFirst({
        where: {
          id: input.productId,
          tenantId: input.tenantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          baseCost: true,
        },
      }),
      input.unitPrice
        ? Promise.resolve(input.unitPrice)
        : this.resolveUnitPrice(input.tenantId, input.productId),
    ]);

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    const qty = asDecimal(input.quantity);
    const discount = asDecimal(input.discount ?? 0);
    const taxRate = asDecimal(input.taxRate ?? 0);
    const lineSubtotal = asDecimal(unitPrice)
      .mul(qty)
      .mul(asDecimal(1).minus(discount.div(100)));

    const item = await prisma.saleItem.create({
      data: {
        saleId: input.saleId,
        productId: product.id,
        description: product.name,
        quantity: qty,
        unitPrice: asDecimal(unitPrice),
        cost: product.baseCost,
        discount,
        taxRate,
        subtotal: lineSubtotal,
      },
    });

    const aggregate = await prisma.saleItem.aggregate({
      where: { saleId: input.saleId },
      _sum: { subtotal: true },
    });

    const subtotal = aggregate._sum.subtotal ?? asDecimal(0);
    const taxAmount = asDecimal(0);

    await prisma.sale.update({
      where: { id: input.saleId },
      data: {
        subtotal,
        taxAmount,
        total: subtotal.plus(taxAmount),
      },
    });

    return item;
  }

  async checkoutSale(input: CheckoutSaleInput) {
    const posEnabled = await this.hasFeature(
      input.tenantId,
      FEATURE_KEYS.POS_ENABLED,
    );
    if (!posEnabled) {
      throw new Error("POS no habilitado para el plan actual.");
    }

    const [existingByTxn, negativeAllowed] = await Promise.all([
      prisma.sale.findFirst({
        where: {
          tenantId: input.tenantId,
          clientTxnId: input.clientTxnId,
        },
        include: {
          items: true,
          payments: true,
        },
      }),
      this.isNegativeStockAllowed(input.tenantId),
    ]);

    if (existingByTxn && existingByTxn.status === SaleStatus.DELIVERED) {
      return existingByTxn;
    }

    const sale = await prisma.$transaction(async (tx) => {
      const currentSale = await tx.sale.findFirst({
        where: {
          id: input.saleId,
          tenantId: input.tenantId,
        },
        include: {
          items: {
            include: {
              sale: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!currentSale) {
        throw new Error("Venta no encontrada.");
      }

      if (currentSale.status !== SaleStatus.PENDING) {
        throw new Error("La venta ya fue procesada.");
      }

      if (!currentSale.items.length) {
        throw new Error("No hay items para procesar en checkout.");
      }

      const session = await tx.cashRegisterSession.findFirst({
        where: {
          id: input.sessionId,
          tenantId: input.tenantId,
          status: CashRegisterSessionStatus.OPEN,
        },
      });

      if (!session) {
        throw new Error("Caja no encontrada o cerrada.");
      }

      const productIds = currentSale.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id));

      const products = await tx.product.findMany({
        where: {
          tenantId: input.tenantId,
          id: { in: productIds },
        },
        select: {
          id: true,
          trackStock: true,
        },
      });

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of currentSale.items) {
        if (!item.productId) continue;

        const product = productMap.get(item.productId);
        if (!product?.trackStock) continue;

        const balance = await tx.inventoryBalance.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: input.locationId,
            },
          },
        });

        const previous = balance?.quantity ?? asDecimal(0);
        const next = previous.minus(item.quantity);

        if (next.lt(0) && !negativeAllowed) {
          throw new Error(
            `Stock insuficiente para producto ${item.productId}.`,
          );
        }

        await tx.inventoryBalance.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: input.locationId,
            },
          },
          update: {
            quantity: next,
            tenantId: input.tenantId,
          },
          create: {
            tenantId: input.tenantId,
            productId: item.productId,
            locationId: input.locationId,
            quantity: next,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId: input.tenantId,
            productId: item.productId,
            locationId: input.locationId,
            saleId: currentSale.id,
            type: InventoryMovementReason.SALE,
            quantity: item.quantity.negated(),
            previousBalance: previous,
            newBalance: next,
            createdBy: input.createdBy,
          },
        });
      }

      const paymentRows = input.payments.map((payment) => ({
        tenantId: input.tenantId,
        saleId: currentSale.id,
        sessionId: input.sessionId,
        method: payment.method,
        amount: asDecimal(payment.amount),
        reference: payment.reference,
      }));

      if (paymentRows.length) {
        await tx.salePayment.createMany({ data: paymentRows });
      }

      const totalPaid = paymentRows.reduce(
        (acc, payment) => acc.plus(payment.amount),
        asDecimal(0),
      );

      if (totalPaid.gt(0)) {
        await tx.cashMovement.create({
          data: {
            tenantId: input.tenantId,
            sessionId: input.sessionId,
            saleId: currentSale.id,
            type: CashMovementType.SALE_INCOME,
            amount: totalPaid,
            createdBy: input.createdBy,
          },
        });
      }

      const updatedSale = await tx.sale.update({
        where: { id: currentSale.id },
        data: {
          clientTxnId: input.clientTxnId,
          posSessionId: input.sessionId,
          amountPaid: totalPaid,
          paymentMethod: paymentRows[0]?.method ?? null,
          status: SaleStatus.DELIVERED,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      return updatedSale;
    });

    invalidateTenantOperationalCaches(input.tenantId);
    return sale;
  }

  async refundOrCancelSale(input: RefundSaleInput) {
    const canRefund = await this.hasFeature(
      input.tenantId,
      FEATURE_KEYS.POS_REFUNDS,
    );
    if (!canRefund) {
      throw new Error("Reembolsos no habilitados para el plan actual.");
    }

    const mode = input.mode ?? "refund";

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          id: input.saleId,
          tenantId: input.tenantId,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!sale) {
        throw new Error("Venta no encontrada.");
      }

      if (![SaleStatus.DELIVERED, SaleStatus.CONFIRMED].includes(sale.status)) {
        throw new Error("La venta no puede ser revertida en su estado actual.");
      }

      const productIds = sale.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id));

      const products = await tx.product.findMany({
        where: {
          tenantId: input.tenantId,
          id: { in: productIds },
        },
        select: {
          id: true,
          trackStock: true,
        },
      });

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of sale.items) {
        if (!item.productId) continue;

        const product = productMap.get(item.productId);
        if (!product?.trackStock) continue;

        const current = await tx.inventoryBalance.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: input.locationId,
            },
          },
        });

        const previous = current?.quantity ?? asDecimal(0);
        const next = previous.plus(item.quantity);

        await tx.inventoryBalance.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: input.locationId,
            },
          },
          update: {
            tenantId: input.tenantId,
            quantity: next,
          },
          create: {
            tenantId: input.tenantId,
            productId: item.productId,
            locationId: input.locationId,
            quantity: next,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId: input.tenantId,
            productId: item.productId,
            locationId: input.locationId,
            saleId: sale.id,
            type: InventoryMovementReason.REFUND,
            quantity: item.quantity,
            previousBalance: previous,
            newBalance: next,
            notes: input.reason,
            createdBy: input.createdBy,
          },
        });
      }

      const totalPaid = sale.payments.reduce(
        (acc, payment) => acc.plus(payment.amount),
        asDecimal(0),
      );

      if (totalPaid.gt(0)) {
        await tx.cashMovement.create({
          data: {
            tenantId: input.tenantId,
            sessionId: input.sessionId,
            saleId: sale.id,
            type: CashMovementType.REFUND_OUT,
            amount: totalPaid.negated(),
            notes: input.reason,
            createdBy: input.createdBy,
          },
        });
      }

      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: {
          status:
            mode === "cancel" ? SaleStatus.CANCELLED : SaleStatus.RETURNED,
          notes: input.reason
            ? `${sale.notes ?? ""}\n${input.reason}`.trim()
            : sale.notes,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      return updated;
    });

    invalidateTenantOperationalCaches(input.tenantId);
    return result;
  }

  async resolveScan(tenantId: string, code: string) {
    const normalized = code.trim();
    if (!normalized) {
      throw new Error("Codigo vacio.");
    }

    const byProduct = await prisma.product.findFirst({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { sku: { equals: normalized, mode: "insensitive" } },
          { barcode: { equals: normalized, mode: "insensitive" } },
          { internalCode: { equals: normalized, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        basePrice: true,
      },
    });

    if (byProduct) return byProduct;

    const barcode = await prisma.productBarcode.findFirst({
      where: {
        tenantId,
        barcode: {
          equals: normalized,
          mode: "insensitive",
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            basePrice: true,
          },
        },
      },
    });

    return barcode?.product ?? null;
  }
}

export const posService = new PosService();
