import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ROLE_HIERARCHY, AUTH_REDIRECTS } from "./constants";
import { getCurrentTenant } from "./get-current-tenant";
import type { Role, TenantContext } from "./types";

export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole as Role);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

export async function requireRole(requiredRole: Role): Promise<TenantContext> {
  const ctx = await getCurrentTenant();
  const locale = await getLocale();

  if (!hasRole(ctx.role, requiredRole)) {
    redirect(AUTH_REDIRECTS.unauthorized(locale));
  }

  return ctx;
}
