import { z } from "zod";

const quoteItemSchema = z
  .object({
    productId: z.string().uuid("invalidProductId").nullable().optional(),
    variantId: z.string().uuid("invalidVariantId").nullable().optional(),
    description: z.string().trim().min(1, "itemDescriptionRequired"),
    quantity: z.coerce.number().positive("quantityMustBePositive"),
    unitPrice: z.coerce.number().min(0, "priceMustBePositive"),
    discount: z.coerce.number().min(0).max(100).optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((item) => Boolean(item.productId) || Boolean(item.variantId), {
    message: "productOrVariantRequired",
    path: ["productId"],
  });

export const createQuoteSchema = z.object({
  tenantId: z.string().uuid("invalidTenantId"),
  customerId: z.string().uuid("invalidCustomerId").nullable().optional(),
  branchId: z.string().uuid("invalidBranchId"),
  notes: z.string().trim().max(1200).nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  createdBy: z.string().uuid("invalidUserId").nullable().optional(),
  items: z.array(quoteItemSchema).min(1, "quoteItemsRequired"),
});

export const convertQuoteToSaleSchema = z.object({
  tenantId: z.string().uuid("invalidTenantId"),
  quoteId: z.string().uuid("invalidQuoteId"),
  warehouseId: z.string().uuid("invalidWarehouseId"),
  createdBy: z.string().uuid("invalidUserId").nullable().optional(),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
export type ConvertQuoteToSaleSchema = z.infer<typeof convertQuoteToSaleSchema>;
