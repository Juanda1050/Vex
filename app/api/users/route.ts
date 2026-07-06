import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import {
  createTenantUserSchema,
  userFiltersSchema,
  userService,
} from "@/server/users";
import {
  getUserApiErrorTranslator,
  getUserErrorStatus,
  mapUserErrorToKey,
  type UserApiErrorKey,
} from "@/server/users/api/error-translator";
import {
  enforceSubscriptionLimit,
  requireSubscriptionFeature,
} from "@/server/subscriptions";
import { HTTP_STATUS } from "@/server/http-status";

export async function GET(request: NextRequest) {
  const translator = await getUserApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("users.view");
    await requireSubscriptionFeature("usersLimit");

    const parsed = userFiltersSchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      isActive: request.nextUrl.searchParams.get("isActive") ?? undefined,
    });

    if (!parsed.success) {
      const key: UserApiErrorKey = "invalidPayload";
      const status = getUserErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const users = await userService.listUsers(ctx.tenantId, parsed.data);

    return NextResponse.json({
      ok: true,
      data: users.items,
      pagination: users.pagination,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapUserErrorToKey(error, "userListFailed");
    const status = getUserErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const translator = await getUserApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("users.create");
    const { subscription } = await requireSubscriptionFeature("usersLimit");

    const activeUsers = await userService.countActiveUsers(ctx.tenantId);
    enforceSubscriptionLimit(
      subscription,
      "usersLimit",
      activeUsers,
      "Limite del plan alcanzado para usersLimit.",
    );

    const body = await request.json();
    const parsed = createTenantUserSchema.safeParse({
      ...body,
      tenantId: ctx.tenantId,
    });

    if (!parsed.success) {
      const issueKey = parsed.error.issues[0]?.message;
      const key: UserApiErrorKey =
        issueKey === "invalidUserId"
          ? "invalidUserId"
          : issueKey === "invalidBranchId"
            ? "invalidBranchId"
            : "invalidPayload";
      const status = getUserErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const user = await userService.createTenantUser(parsed.data);

    return NextResponse.json(
      { ok: true, data: user, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    const key = mapUserErrorToKey(error, "userCreateFailed");
    const status = getUserErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
