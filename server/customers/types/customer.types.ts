export interface CustomerFilters {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateCustomerInput {
  tenantId: string;
  name: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  rfc?: string | null;
  address?: string | null;
  creditLimit?: number | string;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateCustomerInput {
  id: string;
  tenantId: string;
  name?: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  rfc?: string | null;
  address?: string | null;
  creditLimit?: number | string;
  notes?: string | null;
  isActive?: boolean;
}
