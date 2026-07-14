import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { sessionManager } from "../session/session.manager";
import { authService } from "../service/auth.service";
import { authRepository } from "../repository/auth.repository";
import { AUTH_REDIRECTS } from "../constants";
import type { TenantContext } from "../types";
import { getCachedAuthState } from "../cache/auth-state-cache";
import type { SubscriptionStatus } from "@/server/subscriptions/types/subscription.types";

const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
]);

export const requireAuth = cache(
  async function requireAuth(): Promise<TenantContext> {
    const locale = await getLocale();

    const { user, error } = await sessionManager.getUser();
    if (error || !user) redirect(AUTH_REDIRECTS.login(locale));

    await authRepository.upsertUserProfileFromSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
    });

    const authState = await getCachedAuthState(user.id);
    if (!authState.member) redirect(AUTH_REDIRECTS.onboarding(locale));

    const currentSubscription =
      authState.member.tenant.subscriptions[0] ?? null;
    const hasActiveCompanySubscription = currentSubscription
      ? ACTIVE_SUBSCRIPTION_STATUSES.has(currentSubscription.status)
      : false;
    const hasActivationAccess = hasActiveCompanySubscription;

    if (!hasActivationAccess) {
      redirect(AUTH_REDIRECTS.onboarding(locale));
    }

    const branchId = authState.branchId;
    if (!branchId) redirect(AUTH_REDIRECTS.onboarding(locale));

    const warehouseId = authState.warehouseId;
    if (!warehouseId) redirect(AUTH_REDIRECTS.onboarding(locale));

    if (!authState.onboardingCompleted) {
      redirect(AUTH_REDIRECTS.onboarding(locale));
    }

    return authService.buildTenantContext(
      user.id,
      user.email,
      {
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
      },
      authState.member,
      branchId,
      warehouseId,
    );
  },
);
