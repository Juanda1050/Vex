export interface InventoryFilters {
  page: number;
  pageSize: number;
  warehouseId?: string;
  productId?: string;
  variantId?: string;
  lowStockOnly?: boolean;
  sort?: "quantityOnHand";
  dir?: "asc" | "desc";
}

export interface RegisterStockMovementInput {
  tenantId: string;
  warehouseId: string;
  productId?: string | null;
  variantId?: string | null;
  quantity: number | string;
  type:
    | "PURCHASE_IN"
    | "SALE_OUT"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "RETURN_IN"
    | "RETURN_OUT";
  referenceId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}
