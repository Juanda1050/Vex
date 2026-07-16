import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/http-status";

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requirePermission("sales.create");
    const body = await request.json();
    const parsed = createSaleSchema.safeParse(body);

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

    const sale = await posService.createSaleDraft({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      warehouseId: ctx.warehouseId,
      customerId: parsed.data.customerId,
      notes: parsed.data.notes,
      createdBy: ctx.userId,
    });

    return NextResponse.json(
      { ok: true, data: sale, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la venta POS.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
