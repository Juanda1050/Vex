import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermissionApi } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/httpStatus";

const closeSchema = z.object({
  sessionId: z.string().uuid(),
  closingAmount: z.coerce.number(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctxOrError = await requirePermissionApi("sales.create");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const body = request.headers
      .get("content-type")
      ?.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
    const parsed = closeSchema.safeParse(body);

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

    const session = await posService.closeRegister({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      sessionId: parsed.data.sessionId,
      closingAmount: parsed.data.closingAmount,
      notes: parsed.data.notes,
    });

    return NextResponse.json({
      ok: true,
      data: session,
      status: HTTP_STATUS.OK,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo cerrar la caja.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
