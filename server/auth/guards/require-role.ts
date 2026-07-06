import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { authService } from "../service/auth.service";
import { AUTH_REDIRECTS } from "../constants";
import { requireAuth } from "./require-auth";
import type { Role, TenantContext } from "../types";

export async function requireRole(requiredRole: Role): Promise<TenantContext> {
  const ctx = await requireAuth();
  const locale = await getLocale();

  if (!authService.hasRole(ctx.role, requiredRole)) {
    redirect(AUTH_REDIRECTS.unauthorized(locale));
  }

  return ctx;
}
