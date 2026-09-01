import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/server/auth";
import { quoteService } from "@/server/quotes";
import {
  getQuoteApiErrorTranslator,
  getQuoteErrorStatus,
  mapQuoteErrorToKey,
  type QuoteApiErrorKey,
} from "@/server/quotes/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";
import { z } from "zod";

const quoteIdSchema = z.string().uuid("invalidQuoteId");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const translator = await getQuoteApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("quotes.view");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { id } = await context.params;

    const parsedId = quoteIdSchema.safeParse(id);
    if (!parsedId.success) {
      const key: QuoteApiErrorKey = "invalidQuoteId";
      const status = getQuoteErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const quote = await quoteService.getQuote(ctx.tenantId, parsedId.data);

    return NextResponse.json({ ok: true, data: quote, status: HTTP_STATUS.OK });
  } catch (error) {
    const key = mapQuoteErrorToKey(error, "quoteFetchFailed");
    const status = getQuoteErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const translator = await getQuoteApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("quotes.edit");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { id } = await context.params;
    const parsedId = quoteIdSchema.safeParse(id);

    if (!parsedId.success) {
      const key: QuoteApiErrorKey = "invalidQuoteId";
      const status = getQuoteErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    await quoteService.deleteQuote(ctx.tenantId, parsedId.data);

    return NextResponse.json({
      ok: true,
      data: null,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapQuoteErrorToKey(error, "quoteDeleteFailed");
    const status = getQuoteErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
