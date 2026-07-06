import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { quoteService, convertQuoteToSaleSchema } from "@/server/quotes";
import {
  getQuoteApiErrorTranslator,
  getQuoteErrorStatus,
  mapQuoteErrorToKey,
  type QuoteApiErrorKey,
} from "@/server/quotes/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";

export async function POST(request: NextRequest) {
  const translator = await getQuoteApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("quotes.convert");
    const body = await request.json();

    const parsed = convertQuoteToSaleSchema.safeParse({
      ...body,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
    });

    if (!parsed.success) {
      const issueKey = parsed.error.issues[0]?.message;
      const key: QuoteApiErrorKey =
        issueKey === "invalidQuoteId" ? "invalidQuoteId" : "invalidPayload";
      const status = getQuoteErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const sale = await quoteService.convertQuoteToSale(parsed.data);

    return NextResponse.json({ ok: true, data: sale, status: HTTP_STATUS.OK });
  } catch (error) {
    const key = mapQuoteErrorToKey(error, "quoteConvertFailed");
    const status = getQuoteErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
