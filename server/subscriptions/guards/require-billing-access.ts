import { authRepository } from "@/server/auth/repository/auth.repository";
import { authService } from "@/server/auth/service/auth.service";
import { requireAuth } from "@/server/auth/guards/require-auth";
import type { TenantContext } from "@/server/auth/types";

export async function requireBillingAccess(): Promise<TenantContext> {
  const ctx = await requireAuth();

  const overrides = await authRepository.listRolePermissions(
    ctx.tenantId,
    ctx.role,
  );

  if (
    !authService.hasPermissionWithOverrides(
      ctx.role,
      "billing.manage",
      overrides,
    )
  ) {
    throw new Error("No tienes permisos para administrar la suscripcion.");
  }

  return ctx;
}
