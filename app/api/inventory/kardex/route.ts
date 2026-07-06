import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { inventoryService } from "@/server/inventory";
import {
  getInventoryApiErrorTranslator,
  getInventoryErrorStatus,
  mapInventoryErrorToKey,
} from "@/server/inventory/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";

export async function GET(request: NextRequest) {
  const translator = await getInventoryApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("inventory.view");

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
