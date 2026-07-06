import type { UserRole } from "@prisma/client";

export interface RegisterTenantInput {
  name: string;
  slug: string;
  ownerId: string;
}

export interface UpdateTenantBrandingInput {
  tenantId: string;
  logoUrl?: string | null;
  brandPrimary?: string | null;
  brandSecondary?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface SetRolePermissionInput {
  tenantId: string;
  role: UserRole;
  permission: string;
  isAllowed: boolean;
}
