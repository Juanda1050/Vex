import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/http-status";

const refundSchema = z.object({
  locationId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  reason: z.string().trim().max(400).optional(),
  mode: z.enum(["refund", "cancel"]).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("sales.refund");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = refundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payload invalido.",
          status: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const sale = await posService.refundOrCancelSale({
      saleId: id,
      tenantId: ctx.tenantId,
      locationId: parsed.data.locationId,
      sessionId: parsed.data.sessionId,
      reason: parsed.data.reason,
      mode: parsed.data.mode,
      createdBy: ctx.userId,
    });

    return NextResponse.json({ ok: true, data: sale, status: HTTP_STATUS.OK });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo procesar el reembolso.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
