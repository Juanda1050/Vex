export interface TenantContext {
  userId: string;
  email: string;
  tenantId: string;
  branchId: string;
  warehouseId: string;
  role: string;
  tenantName: string;
}

export type Role =
  "OWNER" | "ADMIN" | "SUPEVISOR" | "CASHIER" | "WAREHOUSE" | "PURCHASING";
