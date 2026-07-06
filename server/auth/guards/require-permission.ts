import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { authService } from "../service/auth.service";
import { authRepository } from "../repository/auth.repository";
import { AUTH_REDIRECTS } from "../constants";
import { requireAuth } from "./require-auth";
import type { Permission, TenantContext } from "../types";

export async function requirePermission(
  permission: Permission,
): Promise<TenantContext> {
  const ctx = await requireAuth();
  const locale = await getLocale();

  const overrides = await authRepository.listRolePermissions(
    ctx.tenantId,
    ctx.role,
  );

  if (
    !authService.hasPermissionWithOverrides(ctx.role, permission, overrides)
  ) {
    redirect(AUTH_REDIRECTS.unauthorized(locale));
  }

  return ctx;
}
