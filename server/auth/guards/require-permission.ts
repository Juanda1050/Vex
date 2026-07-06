import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { authService } from "../service/auth.service";
import { AUTH_REDIRECTS } from "../constants";
import { requireAuth } from "./require-auth";
import type { Permission, TenantContext } from "../types";

export async function requirePermission(
  permission: Permission,
): Promise<TenantContext> {
  const ctx = await requireAuth();
  const locale = await getLocale();

  if (!authService.hasPermission(ctx.role, permission)) {
    redirect(AUTH_REDIRECTS.unauthorized(locale));
  }

  return ctx;
}
