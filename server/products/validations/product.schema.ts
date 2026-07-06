import { z } from "zod";

export const createProductSchema = z.object({
  tenantId: z.string().uuid("invalidTenantId"),
  categoryId: z.string().uuid("invalidCategoryId").nullable().optional(),
  brandId: z.string().uuid("invalidBrandId").nullable().optional(),
  unitId: z.string().uuid("invalidUnitId").nullable().optional(),
  name: z.string().trim().min(2, "nameRequired"),
  description: z.string().trim().max(1000).nullable().optional(),
  internalCode: z.string().trim().min(2, "internalCodeRequired"),
  sku: z.string().trim().max(120).nullable().optional(),
  hasVariants: z.boolean().optional(),
  basePrice: z.coerce.number().min(0).optional(),
  baseCost: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  id: z.string().uuid("invalidProductId"),
  tenantId: z.string().uuid("invalidTenantId"),
  categoryId: z.string().uuid("invalidCategoryId").nullable().optional(),
  brandId: z.string().uuid("invalidBrandId").nullable().optional(),
  unitId: z.string().uuid("invalidUnitId").nullable().optional(),
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  sku: z.string().trim().max(120).nullable().optional(),
  basePrice: z.coerce.number().min(0).optional(),
  baseCost: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const productFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid("invalidCategoryId").optional(),
  brandId: z.string().uuid("invalidBrandId").optional(),
  unitId: z.string().uuid("invalidUnitId").optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type ProductFiltersSchema = z.infer<typeof productFiltersSchema>;
