export interface TenantContext {
  userId: string;
  email: string;
  tenantId: string;
  branchId: string;
  warehouseId: string;
  role: string;
  tenantName: string;
}

export interface AuthContext extends TenantContext {
  permissions: string[];
  locale: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
