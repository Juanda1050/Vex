import {
  CashMovementType,
  InventoryMovementReason,
  Prisma,
  SalePayment,
  SaleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { invalidateTenantOperationalCaches } from "@/server/cache/tenantCacheInvalidation";
import { FEATURE_KEYS } from "@/server/plans";
import { getBillingFeaturesForTenant } from "@/server/plans/featureFlags";
import type {
  CreateSaleInput,
  AddSaleItemInput,
  CheckoutSaleInput,
  RefundSaleInput,
} from "../types/pos.types";
import { posRepository } from "../repository/pos.repository";

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

    const openCount = await prisma.cashRegisterSession.count({
      where: {
        tenantId: input.tenantId,
        status: "OPEN",
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

    return posRepository.openRegister(input);
  }

  async closeRegister(input: {
    tenantId: string;
    userId: string;
    sessionId: string;
    closingAmount: number;
    notes?: string;
  }) {
    return posRepository.closeRegister(input);
  }

  async createSaleDraft(input: CreateSaleInput) {
    const enabled = await this.hasFeature(
      input.tenantId,
      FEATURE_KEYS.POS_ENABLED,
    );
    if (!enabled) {
      throw new Error("POS no habilitado para el plan actual.");
    }

    return posRepository.createSaleDraft(input);
  }

  private async resolveUnitPrice(tenantId: string, productId: string) {
    const defaultList = await posRepository.getDefaultPriceList(tenantId);

    if (defaultList) {
      const listPrice = await posRepository.getProductPrice(
        tenantId,
        productId,
        defaultList.id,
      );

      if (listPrice) {
        return Number(listPrice.price);
      }
    }

    const product = await posRepository.getProduct(tenantId, productId);

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    return Number(product.basePrice);
  }

  async addSaleItem(input: AddSaleItemInput) {
    const sale = await posRepository.getSaleBasic(input.tenantId, input.saleId);

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

    const item = await posRepository.addSaleItem({
      ...input,
      unitPrice,
    });

    // Update item with description and cost
    await prisma.saleItem.update({
      where: { id: item.id },
      data: {
        description: product.name,
        cost: product.baseCost,
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
      posRepository.getSaleByClientTxn(input.tenantId, input.clientTxnId),
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
          status: "OPEN",
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

      if (
        sale.status !== SaleStatus.DELIVERED &&
        sale.status !== SaleStatus.CONFIRMED
      ) {
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

      const totalPaid = (sale.payments ?? []).reduce(
        (acc: Prisma.Decimal, payment: SalePayment) => acc.plus(payment.amount),
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
    return posRepository.resolveScan(tenantId, code);
  }
}

export const posService = new PosService();
