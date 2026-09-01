import { PosPaymentMethod } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePermissionApi } from "@/server/auth";
import { posService } from "@/server/pos";
import { HTTP_STATUS } from "@/server/httpStatus";

const paymentSchema = z.object({
  method: z.nativeEnum(PosPaymentMethod),
  amount: z.coerce.number().positive(),
  reference: z.string().trim().max(120).optional(),
});

const checkoutSchema = z.object({
  sessionId: z.string().uuid(),
  locationId: z.string().uuid(),
  clientTxnId: z.string().trim().min(8).max(96),
  payments: z.array(paymentSchema).min(1),
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
    const parsed = checkoutSchema.safeParse(body);

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

    const sale = await posService.checkoutSale({
      saleId: parsedSaleId.data,
      tenantId: ctx.tenantId,
      sessionId: parsed.data.sessionId,
      locationId: parsed.data.locationId,
      clientTxnId: parsed.data.clientTxnId,
      payments: parsed.data.payments,
      createdBy: ctx.userId,
    });

    return NextResponse.json({ ok: true, data: sale, status: HTTP_STATUS.OK });
  } catch (error) {
    const status =
      error instanceof Error && error.message.includes("Stock insuficiente")
        ? HTTP_STATUS.CONFLICT
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo hacer checkout.",
        status,
      },
      { status },
    );
  }
}
