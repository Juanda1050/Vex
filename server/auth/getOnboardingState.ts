import { cache } from "react";
import { sessionManager } from "./session/session.manager";
import type { Role } from "./types";
import { getCachedAuthState } from "./cache/authStateCache";
import type { SubscriptionStatus } from "@/server/subscriptions/types/subscription.types";

const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
]);

export interface OnboardingState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  tenantId: string | null;
  role: Role | null;
  onboardingCompleted: boolean;
  hasTenantMember: boolean;
  hasActiveUserMember: boolean;
  hasActiveCompanySubscription: boolean;
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
        hasActiveUserMember: false,
        hasActiveCompanySubscription: false,
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
        hasActiveUserMember: false,
        hasActiveCompanySubscription: false,
        hasBranch: false,
        hasWarehouse: false,
        hasBillingAccess: false,
        needsOnboarding: true,
      };
    }

    const branchId = authState.branchId;
    const warehouseId = authState.warehouseId;
    const currentSubscription =
      authState.member.tenant.subscriptions[0] ?? null;
    const hasActiveCompanySubscription = currentSubscription
      ? ACTIVE_SUBSCRIPTION_STATUSES.has(currentSubscription.status)
      : false;
    const hasActiveUserMember = authState.member.isActive;
    const hasActivationAccess = hasActiveCompanySubscription;
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
      hasActiveUserMember,
      hasActiveCompanySubscription,
      hasBranch,
      hasWarehouse,
      hasBillingAccess: authState.hasBillingAccess,
      needsOnboarding:
        !hasActivationAccess ||
        !hasBranch ||
        !hasWarehouse ||
        !authState.onboardingCompleted,
    };
  },
);
