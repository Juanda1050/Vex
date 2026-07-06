import { z } from "zod";
import { paginationSchema } from "@/server/pagination";

const movementTypeEnum = z.enum([
  "PURCHASE_IN",
  "SALE_OUT",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "RETURN_IN",
  "RETURN_OUT",
]);

export const registerStockMovementSchema = z
  .object({
    tenantId: z.string().uuid("invalidTenantId"),
    warehouseId: z.string().uuid("invalidWarehouseId"),
    productId: z.string().uuid("invalidProductId").nullable().optional(),
    variantId: z.string().uuid("invalidVariantId").nullable().optional(),
    quantity: z.coerce.number().positive("quantityMustBePositive"),
    type: movementTypeEnum,
    referenceId: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    createdBy: z.string().uuid("invalidUserId").nullable().optional(),
  })
  .refine((data) => Boolean(data.productId) || Boolean(data.variantId), {
    message: "productOrVariantRequired",
    path: ["productId"],
  });

export const inventoryFiltersSchema = paginationSchema.extend({
  warehouseId: z.string().uuid("invalidWarehouseId").optional(),
  productId: z.string().uuid("invalidProductId").optional(),
  variantId: z.string().uuid("invalidVariantId").optional(),
  lowStockOnly: z.coerce.boolean().optional(),
});

export type RegisterStockMovementSchema = z.infer<
  typeof registerStockMovementSchema
>;
export type InventoryFiltersSchema = z.infer<typeof inventoryFiltersSchema>;
