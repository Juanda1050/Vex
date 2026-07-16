import { PosPaymentMethod } from "@prisma/client";

export type PaymentInput = {
  method: PosPaymentMethod;
  amount: number;
  reference?: string;
};

export type CreateSaleInput = {
  tenantId: string;
  branchId: string;
  warehouseId: string;
  customerId?: string;
  notes?: string;
  createdBy?: string;
};

export type AddSaleItemInput = {
  saleId: string;
  tenantId: string;
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
};

export type CheckoutSaleInput = {
  saleId: string;
  tenantId: string;
  sessionId: string;
  locationId: string;
  clientTxnId: string;
  payments: PaymentInput[];
  createdBy?: string;
};

export type RefundSaleInput = {
  saleId: string;
  tenantId: string;
  sessionId?: string;
  locationId: string;
  reason?: string;
  createdBy?: string;
  mode?: "refund" | "cancel";
};
