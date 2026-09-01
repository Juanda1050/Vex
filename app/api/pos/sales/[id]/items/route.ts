import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermissionApi } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/httpStatus";

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive().optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

const saleIdSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctxOrError = await requirePermissionApi("sales.create");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { id } = await context.params;
    const parsedSaleId = saleIdSchema.safeParse(id);
    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);

    if (!parsedSaleId.success || !parsed.success) {
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
      saleId: parsedSaleId.data,
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
