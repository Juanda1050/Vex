import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { authRepository } from "../repository/auth.repository";
import { authService } from "../service/auth.service";
import { AUTH_REDIRECTS } from "../constants";
import type { TenantContext } from "../types";

export async function requireAuth(): Promise<TenantContext> {
  const locale = await getLocale();

  const { user, error } = await sessionManager.getUser();
  if (error || !user) redirect(AUTH_REDIRECTS.login(locale));

  const member = await authRepository.findMemberByUserId(user.id);
  if (!member) redirect(AUTH_REDIRECTS.onboarding(locale));

  const branchId = authService.resolveBranchId(member);
  if (!branchId) redirect(AUTH_REDIRECTS.onboarding(locale));

  const warehouseId = authService.resolveWarehouseId(member);
  if (!warehouseId) redirect(AUTH_REDIRECTS.onboarding(locale));

  return authService.buildTenantContext(
    user.id,
    user.email,
    member,
    branchId,
    warehouseId,
  );
}
