import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/server/auth";
import { inventoryService } from "@/server/inventory";
import {
  enforceSubscriptionLimit,
  requireSubscriptionFeature,
} from "@/server/subscriptions";
import {
  getInventoryApiErrorTranslator,
  getInventoryErrorStatus,
  mapInventoryErrorToKey,
} from "@/server/inventory/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";

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

    const warehouseId =
      request.nextUrl.searchParams.get("warehouseId") ?? undefined;
    const productId =
      request.nextUrl.searchParams.get("productId") ?? undefined;
    const variantId =
      request.nextUrl.searchParams.get("variantId") ?? undefined;

    const rows = await inventoryService.getKardex({
      tenantId: ctx.tenantId,
      warehouseId,
      productId,
      variantId,
    });

    return NextResponse.json({ ok: true, data: rows, status: HTTP_STATUS.OK });
  } catch (error) {
    const key = mapInventoryErrorToKey(error, "inventoryKardexFailed");
    const status = getInventoryErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
