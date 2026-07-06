import type { UserRole } from "@prisma/client";

export interface UserFilters {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateTenantUserInput {
  tenantId: string;
  userId: string;
  role: UserRole;
  branchId?: string | null;
}
