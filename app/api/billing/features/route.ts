import { NextResponse } from "next/server";

import { requireAuthApi } from "@/server/auth";
import { getBillingFeaturesForTenant } from "@/server/plans";
import { HTTP_STATUS } from "@/server/httpStatus";

export async function GET() {
  try {
    const ctxOrError = await requireAuthApi();
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const featureSet = await getBillingFeaturesForTenant(ctx.tenantId);

    return NextResponse.json({
      ok: true,
      data: featureSet,
      status: HTTP_STATUS.OK,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron obtener features del plan.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
