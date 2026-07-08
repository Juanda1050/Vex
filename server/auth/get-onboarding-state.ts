import { cache } from "react";
import { authRepository } from "./repository/auth.repository";
import { authService } from "./service/auth.service";
import { sessionManager } from "./session/session.manager";
import type { Role } from "./types";

export interface OnboardingState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  tenantId: string | null;
  role: Role | null;
  onboardingCompleted: boolean;
  hasTenantMember: boolean;
  hasBranch: boolean;
  hasWarehouse: boolean;
  hasBillingAccess: boolean;
  needsOnboarding: boolean;
}

export const getOnboardingState = cache(
  async function getOnboardingState(): Promise<OnboardingState> {
    const { user } = await sessionManager.getUser();

    if (!user) {
      return {
        isAuthenticated: false,
        userId: null,
        email: null,
        tenantId: null,
        role: null,
        onboardingCompleted: false,
        hasTenantMember: false,
        hasBranch: false,
        hasWarehouse: false,
        hasBillingAccess: false,
        needsOnboarding: false,
      };
    }

    const userProfile = await authRepository.getOrCreateUserProfile(user.id);

    const member = await authRepository.findMemberByUserId(user.id);
    if (!member) {
      return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email,
        tenantId: null,
        role: null,
        onboardingCompleted: userProfile.onboardingCompleted,
        hasTenantMember: false,
        hasBranch: false,
        hasWarehouse: false,
        hasBillingAccess: false,
        needsOnboarding: true,
      };
    }

    const branchId = authService.resolveBranchId(member);
    const warehouseId = authService.resolveWarehouseId(member);
    const hasBranch = Boolean(branchId);
    const hasWarehouse = Boolean(warehouseId);

    const overrides = await authRepository.listRolePermissions(
      member.tenantId,
      member.role,
    );

    const hasBillingAccess = authService.hasPermissionWithOverrides(
      member.role,
      "billing.manage",
      overrides,
    );

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email,
      tenantId: member.tenantId,
      role: member.role,
      onboardingCompleted: userProfile.onboardingCompleted,
      hasTenantMember: true,
      hasBranch,
      hasWarehouse,
      hasBillingAccess,
      needsOnboarding:
        !hasBranch || !hasWarehouse || !userProfile.onboardingCompleted,
    };
  },
);
