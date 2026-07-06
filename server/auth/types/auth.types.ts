import type { Permission, Role } from "./permissions.types";

export interface TenantContext {
  userId: string;
  email: string;
  tenantId: string;
  branchId: string;
  warehouseId: string;
  role: Role;
  tenantName: string;
}

export interface AuthContext extends TenantContext {
  permissions: Permission[];
  locale: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
