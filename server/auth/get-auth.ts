import { getLocale } from "next-intl/server";
import { requireAuth } from "./guards/require-auth";
import { authService } from "./service/auth.service";
import { cookieManager } from "./cookies/cookie.manager";
import { permissionChecker } from "./permissions/permission.checker";
import type { AuthContext, Permission } from "./types";

export async function getAuth(): Promise<AuthContext> {
  const [ctx, locale] = await Promise.all([requireAuth(), getLocale()]);

  const permissions = authService.getPermissions(ctx.role);

  await Promise.all([
    cookieManager.setBranchId(ctx.branchId),
    cookieManager.setWarehouseId(ctx.warehouseId),
  ]);

  return {
    ...ctx,
    permissions,
    locale,
  };
}

export function can(auth: AuthContext, permission: Permission): boolean {
  return permissionChecker.can(auth.role, permission);
}
