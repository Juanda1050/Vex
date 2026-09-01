import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/server/auth";
import {
  quoteService,
  createQuoteSchema,
  quoteFiltersSchema,
} from "@/server/quotes";
import {
  getQuoteApiErrorTranslator,
  getQuoteErrorStatus,
  mapQuoteErrorToKey,
  type QuoteApiErrorKey,
} from "@/server/quotes/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";

export async function GET(request: NextRequest) {
  const translator = await getQuoteApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("quotes.view");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const parsed = quoteFiltersSchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
      branchId: request.nextUrl.searchParams.get("branchId") ?? undefined,
    });

    if (!parsed.success) {
      const key: QuoteApiErrorKey = "invalidPayload";
      const status = getQuoteErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const quotes = await quoteService.listQuotes(ctx.tenantId, parsed.data);

    return NextResponse.json({
      ok: true,
      data: quotes.items,
      pagination: quotes.pagination,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapQuoteErrorToKey(error, "quoteListFailed");
    const status = getQuoteErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const translator = await getQuoteApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("quotes.create");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const body = await request.json();

    const parsed = createQuoteSchema.safeParse({
      ...body,
      tenantId: ctx.tenantId,
      branchId: body.branchId ?? ctx.branchId,
      createdBy: ctx.userId,
    });

    if (!parsed.success) {
      const key: QuoteApiErrorKey = "invalidPayload";
      const status = getQuoteErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const quote = await quoteService.createQuote(parsed.data);

    return NextResponse.json(
      { ok: true, data: quote, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    const key = mapQuoteErrorToKey(error, "quoteCreateFailed");
    const status = getQuoteErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
