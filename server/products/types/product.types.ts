export interface ProductFilters {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  isActive?: boolean;
  sort?: "name" | "basePrice" | "baseCost";
  dir?: "asc" | "desc";
}

export interface CreateProductInput {
  tenantId: string;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  name: string;
  description?: string | null;
  internalCode: string;
  sku?: string | null;
  hasVariants?: boolean;
  basePrice?: number | string;
  baseCost?: number | string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  id: string;
  tenantId: string;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  name?: string;
  description?: string | null;
  sku?: string | null;
  basePrice?: number | string;
  baseCost?: number | string;
  isActive?: boolean;
}
