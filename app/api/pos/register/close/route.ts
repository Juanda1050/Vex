import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/http-status";

const closeSchema = z.object({
  sessionId: z.string().uuid(),
  closingAmount: z.coerce.number(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requirePermission("sales.create");
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
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "No se pudo cerrar la caja.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
