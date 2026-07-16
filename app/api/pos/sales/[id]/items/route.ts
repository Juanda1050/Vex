import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/http-status";

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive().optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("sales.create");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);

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

    const item = await posService.addSaleItem({
      saleId: id,
      tenantId: ctx.tenantId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      discount: parsed.data.discount,
      taxRate: parsed.data.taxRate,
    });

    return NextResponse.json(
      { ok: true, data: item, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo agregar el item.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
