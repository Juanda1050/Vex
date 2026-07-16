import {
  CashMovementType,
  CashRegisterSessionStatus,
  InventoryMovementReason,
  Prisma,
  SaleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CreateSaleInput, AddSaleItemInput } from "../types/pos.types";

function asDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

export class PosRepository {
  async openRegister(input: {
    tenantId: string;
    userId: string;
    locationId: string;
    registerName: string;
    openingFloatAmount?: number;
    notes?: string;
  }) {
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

  async getProduct(tenantId: string, productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        baseCost: true,
        basePrice: true,
        trackStock: true,
        sku: true,
        barcode: true,
        internalCode: true,
      },
    });
  }

  async getSale(tenantId: string, saleId: string) {
    return prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async getSaleBasic(tenantId: string, saleId: string) {
    return prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async getSaleByClientTxn(tenantId: string, clientTxnId: string) {
    return prisma.sale.findFirst({
      where: {
        tenantId,
        clientTxnId,
      },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async getDefaultPriceList(tenantId: string) {
    return prisma.priceList.findFirst({
      where: {
        tenantId,
        isDefault: true,
        isActive: true,
      },
      select: { id: true },
    });
  }

  async getProductPrice(
    tenantId: string,
    productId: string,
    priceListId: string,
  ) {
    const now = new Date();
    return prisma.productPrice.findFirst({
      where: {
        tenantId,
        productId,
        priceListId,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      orderBy: {
        validFrom: "desc",
      },
    });
  }

  async addSaleItem(input: AddSaleItemInput) {
    const qty = asDecimal(input.quantity);
    const discount = asDecimal(input.discount ?? 0);
    const taxRate = asDecimal(input.taxRate ?? 0);
    const lineSubtotal = asDecimal(input.unitPrice ?? 0)
      .mul(qty)
      .mul(asDecimal(1).minus(discount.div(100)));

    const item = await prisma.saleItem.create({
      data: {
        saleId: input.saleId,
        productId: input.productId,
        description: "", // Will be set by service
        quantity: qty,
        unitPrice: asDecimal(input.unitPrice ?? 0),
        cost: asDecimal(0), // Will be set by service
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

  async getCashRegisterSession(tenantId: string, sessionId: string) {
    return prisma.cashRegisterSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        status: CashRegisterSessionStatus.OPEN,
      },
    });
  }

  async getInventoryBalance(productId: string, locationId: string) {
    return prisma.inventoryBalance.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });
  }

  async getProducts(tenantId: string, productIds: string[]) {
    return prisma.product.findMany({
      where: {
        tenantId,
        id: { in: productIds },
      },
      select: {
        id: true,
        trackStock: true,
      },
    });
  }

  async createPayments(
    payments: Array<{
      tenantId: string;
      saleId: string;
      sessionId: string;
      method: import("@prisma/client").PosPaymentMethod;
      amount: Prisma.Decimal;
      reference?: string;
    }>,
  ) {
    return prisma.salePayment.createMany({ data: payments });
  }

  async updateInventoryBalance(
    tenantId: string,
    productId: string,
    locationId: string,
    quantity: Prisma.Decimal,
  ) {
    return prisma.inventoryBalance.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        quantity,
        tenantId,
      },
      create: {
        tenantId,
        productId,
        locationId,
        quantity,
      },
    });
  }

  async createInventoryMovement(input: {
    tenantId: string;
    productId: string;
    locationId: string;
    saleId: string;
    type: InventoryMovementReason;
    quantity: Prisma.Decimal;
    previousBalance: Prisma.Decimal;
    newBalance: Prisma.Decimal;
    notes?: string;
    createdBy?: string;
  }) {
    return prisma.inventoryMovement.create({
      data: input,
    });
  }

  async createCashMovement(input: {
    tenantId: string;
    sessionId: string;
    saleId?: string;
    type: CashMovementType;
    amount: Prisma.Decimal;
    notes?: string;
    createdBy?: string;
  }) {
    return prisma.cashMovement.create({
      data: input,
    });
  }

  async updateSaleCheckout(input: {
    saleId: string;
    clientTxnId: string;
    posSessionId: string;
    amountPaid: Prisma.Decimal;
    paymentMethod: import("@prisma/client").PosPaymentMethod | null;
  }) {
    return prisma.sale.update({
      where: { id: input.saleId },
      data: {
        clientTxnId: input.clientTxnId,
        posSessionId: input.posSessionId,
        amountPaid: input.amountPaid,
        paymentMethod: input.paymentMethod,
        status: SaleStatus.DELIVERED,
      },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async updateSaleRefund(input: {
    saleId: string;
    status: SaleStatus;
    notes?: string;
  }) {
    return prisma.sale.update({
      where: { id: input.saleId },
      data: {
        status: input.status,
        notes: input.notes,
      },
      include: {
        items: true,
        payments: true,
      },
    });
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

export const posRepository = new PosRepository();
