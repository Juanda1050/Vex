import { authService } from "@/server/auth/service/auth.service";
import { requireAuth } from "@/server/auth/guards/require-auth";
import type { TenantContext } from "@/server/auth/types";

export async function requireBillingAccess(): Promise<TenantContext> {
  const ctx = await requireAuth();

  if (!authService.hasRole(ctx.role, "ADMIN")) {
    throw new Error("No tienes permisos para administrar la suscripcion.");
  }

  return ctx;
}
