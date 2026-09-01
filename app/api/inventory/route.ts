import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/server/auth";
import {
  inventoryService,
  inventoryFiltersSchema,
  registerStockMovementSchema,
} from "@/server/inventory";
import {
  enforceSubscriptionLimit,
  requireSubscriptionFeature,
} from "@/server/subscriptions";
import {
  getInventoryApiErrorTranslator,
  getInventoryErrorStatus,
  mapInventoryErrorToKey,
  type InventoryApiErrorKey,
} from "@/server/inventory/api/errorTranslator";
import { HTTP_STATUS } from "@/server/httpStatus";
import { writeAuditLog } from "@/server/auditLog";

export async function GET(request: NextRequest) {
  const translator = await getInventoryApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("inventory.view");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { subscription } =
      await requireSubscriptionFeature("warehousesLimit");
    const activeWarehouses = await inventoryService.countActiveWarehouses(
      ctx.tenantId,
    );

    enforceSubscriptionLimit(
      subscription,
      "warehousesLimit",
      activeWarehouses,
      "Limite del plan alcanzado para warehousesLimit.",
    );

    const parsed = inventoryFiltersSchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      warehouseId: request.nextUrl.searchParams.get("warehouseId") ?? undefined,
      productId: request.nextUrl.searchParams.get("productId") ?? undefined,
      variantId: request.nextUrl.searchParams.get("variantId") ?? undefined,
      lowStockOnly:
        request.nextUrl.searchParams.get("lowStockOnly") ?? undefined,
    });

    if (!parsed.success) {
      const key: InventoryApiErrorKey = "invalidPayload";
      const status = getInventoryErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const inventory = await inventoryService.listInventory(
      ctx.tenantId,
      parsed.data,
    );

    return NextResponse.json({
      ok: true,
      data: inventory.items,
      pagination: inventory.pagination,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapInventoryErrorToKey(error, "inventoryListFailed");
    const status = getInventoryErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const translator = await getInventoryApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("inventory.adjust");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { subscription } =
      await requireSubscriptionFeature("warehousesLimit");
    const activeWarehouses = await inventoryService.countActiveWarehouses(
      ctx.tenantId,
    );

    enforceSubscriptionLimit(
      subscription,
      "warehousesLimit",
      activeWarehouses,
      "Limite del plan alcanzado para warehousesLimit.",
    );

    const body = await request.json();
    const parsed = registerStockMovementSchema.safeParse({
      ...body,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
    });

    if (!parsed.success) {
      const key: InventoryApiErrorKey = "invalidPayload";
      const status = getInventoryErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const result = await inventoryService.registerStockMovement(parsed.data);

    await writeAuditLog({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "INVENTORY_MOVEMENT_CREATED",
      resourceType: "stock_movement",
      metadata: {
        warehouseId: parsed.data.warehouseId,
        productId: parsed.data.productId,
        movementType: parsed.data.type,
      },
    });

    return NextResponse.json(
      { ok: true, data: result, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    const key = mapInventoryErrorToKey(error, "inventoryMovementFailed");
    const status = getInventoryErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
