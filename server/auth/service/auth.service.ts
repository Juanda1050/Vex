import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from "../constants";
import type { TenantMember } from "../repository/auth.repository";
import type { Role, Permission, TenantContext } from "../types";
import { FREE_PLAN_CODE } from "@/server/subscriptions";

export const authService = {
  resolveBranchId(member: TenantMember): string | null {
    return member.branchId ?? member.tenant.branches[0]?.id ?? null;
  },

  resolveWarehouseId(member: TenantMember): string | null {
    return (
      member.branch?.warehouses[0]?.id ??
      member.tenant.branches[0]?.warehouses[0]?.id ??
      null
    );
  },

  buildTenantContext(
    userId: string,
    email: string,
    member: TenantMember,
    branchId: string,
    warehouseId: string,
  ): TenantContext {
    const currentSubscription = member.tenant.subscriptions[0] ?? null;
    const planTier = currentSubscription?.plan.tier ?? "FREE";

    return {
      userId,
      email,
      tenantId: member.tenantId,
      branchId,
      warehouseId,
      role: member.role,
      tenantName: member.tenant.name,
      subscriptionPlanCode: currentSubscription?.plan.code ?? FREE_PLAN_CODE,
      subscriptionPlanTier: planTier,
      subscriptionStatus: currentSubscription?.status ?? "ACTIVE",
      isPremium:
        (planTier === "PREMIUM" || planTier === "ENTERPRISE") &&
        (currentSubscription?.status === "TRIALING" ||
          currentSubscription?.status === "ACTIVE" ||
          currentSubscription?.status === "PAST_DUE"),
    };
  },

  hasRole(userRole: Role, requiredRole: Role): boolean {
    const userIndex = ROLE_HIERARCHY.indexOf(userRole);
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userIndex >= requiredIndex;
  },

  getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
  },

  hasPermission(role: Role, permission: Permission): boolean {
    const permissions = this.getPermissions(role);
    return permissions.includes(permission);
  },
};
