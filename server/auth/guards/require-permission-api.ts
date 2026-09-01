import { NextResponse } from "next/server";
import { authService } from "../service/auth.service";
import { authRepository } from "../repository/auth.repository";
import { requireAuthApi } from "./require-auth-api";
import type { Permission, TenantContext } from "../types";

/**
 * API-safe permission guard that returns NextResponse with 401/403.
 * Replaces `requirePermission()` for API routes.
 *
 * Checks authentication first, then verifies the requested permission.
 *
 * @throws Never (returns NextResponse instead)
 * @returns TenantContext on success or NextResponse with error status
 */
export async function requirePermissionApi(
  permission: Permission,
): Promise<TenantContext | NextResponse> {
  const ctxOrError = await requireAuthApi();

  // If requireAuthApi returned a NextResponse (error), return it
  if (ctxOrError instanceof NextResponse) {
    return ctxOrError;
  }

  const ctx = ctxOrError;

  const overrides = await authRepository.listRolePermissions(
    ctx.tenantId,
    ctx.role,
  );

  if (
    !authService.hasPermissionWithOverrides(ctx.role, permission, overrides)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Forbidden",
        errorKey: "forbidden",
      },
      { status: 403 },
    );
  }

  return ctx;
}
