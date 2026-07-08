import { cache } from "react";
import { authService } from "./service/auth.service";
import { sessionManager } from "./session/session.manager";
import type { Role } from "./types";
import { getCachedAuthState } from "./cache/auth-state-cache";

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

    const authState = await getCachedAuthState(user.id);

    if (!authState.member) {
      return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email,
        tenantId: null,
        role: null,
        onboardingCompleted: authState.onboardingCompleted,
        hasTenantMember: false,
        hasBranch: false,
        hasWarehouse: false,
        hasBillingAccess: false,
        needsOnboarding: true,
      };
    }

    const branchId = authState.branchId;
    const warehouseId = authState.warehouseId;
    const hasBranch = Boolean(branchId);
    const hasWarehouse = Boolean(warehouseId);

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email,
      tenantId: authState.member.tenantId,
      role: authState.member.role,
      onboardingCompleted: authState.onboardingCompleted,
      hasTenantMember: true,
      hasBranch,
      hasWarehouse,
      hasBillingAccess: authState.hasBillingAccess,
      needsOnboarding:
        !hasBranch || !hasWarehouse || !authState.onboardingCompleted,
    };
  },
);
