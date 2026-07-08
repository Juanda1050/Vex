import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { sessionManager } from "../session/session.manager";
import { authService } from "../service/auth.service";
import { AUTH_REDIRECTS } from "../constants";
import type { TenantContext } from "../types";
import { getCachedAuthState } from "../cache/auth-state-cache";

export const requireAuth = cache(
  async function requireAuth(): Promise<TenantContext> {
    const locale = await getLocale();

    const { user, error } = await sessionManager.getUser();
    if (error || !user) redirect(AUTH_REDIRECTS.login(locale));

    const authState = await getCachedAuthState(user.id);
    if (!authState.member) redirect(AUTH_REDIRECTS.onboarding(locale));

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
      },
      authState.member,
      branchId,
      warehouseId,
    );
  },
);
