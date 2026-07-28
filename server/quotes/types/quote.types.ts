export interface QuoteItemInput {
  productId?: string | null;
  variantId?: string | null;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discount?: number | string;
  taxRate?: number | string;
}

export interface CreateQuoteInput {
  tenantId: string;
  customerId?: string | null;
  branchId: string;
  notes?: string | null;
  validUntil?: Date | string | null;
  createdBy?: string | null;
  items: QuoteItemInput[];
}

export interface QuoteFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED";
  customerId?: string;
  branchId?: string;
  sort?: "total" | "validUntil" | "createdAt";
  dir?: "asc" | "desc";
}

export interface ConvertQuoteToSaleInput {
  tenantId: string;
  quoteId: string;
  warehouseId: string;
  createdBy?: string | null;
}
