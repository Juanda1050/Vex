import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermissionApi } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/httpStatus";

const openSchema = z.object({
  locationId: z.string().uuid(),
  registerName: z.string().trim().min(1).max(80),
  openingFloatAmount: z.coerce.number().min(0).default(0),
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
    const parsed = openSchema.safeParse(body);

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

    const session = await posService.openRegister({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      locationId: parsed.data.locationId,
      registerName: parsed.data.registerName,
      openingFloatAmount: parsed.data.openingFloatAmount,
      notes: parsed.data.notes,
    });

    return NextResponse.json(
      { ok: true, data: session, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo abrir la caja.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
