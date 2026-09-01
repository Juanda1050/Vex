import { NextResponse } from "next/server";
import { sessionManager } from "../session/session.manager";
import { authRepository } from "../repository/auth.repository";
import type { TenantContext } from "../types";
import { getCachedAuthState } from "../cache/authStateCache";
import type { SubscriptionStatus } from "@/server/subscriptions/types/subscription.types";

const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
]);

/**
 * API-safe authentication guard that returns NextResponse with 401/403.
 * Replaces `requireAuth()` for API routes.
 *
 * @throws Never (returns NextResponse instead)
 * @returns TenantContext on success or NextResponse with error status
 */
export async function requireAuthApi(): Promise<TenantContext | NextResponse> {
  const { user, error } = await sessionManager.getUser();
  if (error || !user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        errorKey: "unauthorized",
      },
      { status: 401 },
    );
  }

  await authRepository.upsertUserProfileFromSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
  });

  const authState = await getCachedAuthState(user.id);
  if (!authState.member) {
    return NextResponse.json(
      {
        ok: false,
        error: "Onboarding required",
        errorKey: "onboardingRequired",
      },
      { status: 403 },
    );
  }

  const currentSubscription = authState.member.tenant.subscriptions[0] ?? null;
  const hasActiveCompanySubscription = currentSubscription
    ? ACTIVE_SUBSCRIPTION_STATUSES.has(currentSubscription.status)
    : false;

  if (!hasActiveCompanySubscription) {
    return NextResponse.json(
      {
        ok: false,
        error: "Subscription required",
        errorKey: "subscriptionRequired",
      },
      { status: 403 },
    );
  }

  const branchId = authState.branchId;
  if (!branchId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Onboarding required",
        errorKey: "onboardingRequired",
      },
      { status: 403 },
    );
  }

  const warehouseId = authState.warehouseId;
  if (!warehouseId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Onboarding required",
        errorKey: "onboardingRequired",
      },
      { status: 403 },
    );
  }

  // Build complete TenantContext from member data
  const ctx: TenantContext = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    tenantId: authState.member.tenant.id,
    branchId,
    warehouseId,
    role: authState.member.role,
    tenantName: authState.member.tenant.name,
    subscriptionPlanCode: currentSubscription?.plan.code ?? "",
    subscriptionPlanTier: currentSubscription?.plan.tier ?? "FREE",
    subscriptionStatus: currentSubscription?.status ?? "CANCELLED",
    isPremium:
      currentSubscription?.plan.tier === "PREMIUM" ||
      currentSubscription?.plan.tier === "ENTERPRISE",
  };

  return ctx;
}
