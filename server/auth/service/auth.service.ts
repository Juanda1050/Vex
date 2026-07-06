import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from "../constants";
import type { TenantMember } from "../repository/auth.repository";
import type { Role, Permission, TenantContext } from "../types";

export const authService = {
  resolveBranchId(member: TenantMember): string | null {
    return member.branchId ?? member.tenant.branches[0]?.id ?? null;
  },

  resolveWarehouseId(member: TenantMember): string | null {
    return member.branch?.warehouses[0]?.id ?? null;
  },

  buildTenantContext(
    userId: string,
    email: string,
    member: TenantMember,
    branchId: string,
    warehouseId: string,
  ): TenantContext {
    return {
      userId,
      email,
      tenantId: member.tenantId,
      branchId,
      warehouseId,
      role: member.role,
      tenantName: member.tenant.name,
    };
  },

  hasRole(userRole: string, requiredRole: Role): boolean {
    const userIndex = ROLE_HIERARCHY.indexOf(userRole as Role);
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userIndex >= requiredIndex;
  },

  getPermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role as Role] ?? [];
  },

  hasPermission(role: string, permission: Permission): boolean {
    const permissions = this.getPermissions(role);
    return permissions.includes(permission);
  },
};
