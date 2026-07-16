import { NextResponse } from "next/server";

import { requireAuth } from "@/server/auth";
import { getBillingFeaturesForTenant } from "@/server/plans";
import { HTTP_STATUS } from "@/server/http-status";

export async function GET() {
  try {
    const ctx = await requireAuth();
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
