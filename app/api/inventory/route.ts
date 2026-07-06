import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import {
  inventoryService,
  inventoryFiltersSchema,
  registerStockMovementSchema,
} from "@/server/inventory";
import {
  getInventoryApiErrorTranslator,
  getInventoryErrorStatus,
  mapInventoryErrorToKey,
  type InventoryApiErrorKey,
} from "@/server/inventory/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";

export async function GET(request: NextRequest) {
  const translator = await getInventoryApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("inventory.view");
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
    const ctx = await requirePermission("inventory.adjust");
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
