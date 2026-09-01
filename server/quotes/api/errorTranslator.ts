import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getErrorTranslator } from "@/server/errorTranslator";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/httpStatus";

type AppLocale = (typeof routing.locales)[number];

export type QuoteApiErrorKey =
  | "generic"
  | "invalidPayload"
  | "invalidQuoteId"
  | "quoteNotFound"
  | "quoteCreateFailed"
  | "quoteFetchFailed"
  | "quoteListFailed"
  | "quoteDeleteFailed"
  | "quoteDeleteNotAllowed"
  | "quoteConvertFailed"
  | "quoteAlreadyConverted"
  | "quoteNotAccepted"
  | "insufficientStock"
  | "warehouseNotFound"
  | "customerNotFound"
  | "branchNotFound"
  | "productNotFound"
  | "variantNotFound"
  | "crossTenantResource";

const QUOTE_ERROR_STATUS: Record<QuoteApiErrorKey, HttpStatusCode> = {
  generic: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  invalidPayload: HTTP_STATUS.BAD_REQUEST,
  invalidQuoteId: HTTP_STATUS.BAD_REQUEST,
  quoteNotFound: HTTP_STATUS.NOT_FOUND,
  quoteCreateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  quoteFetchFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  quoteListFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  quoteDeleteFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  quoteDeleteNotAllowed: HTTP_STATUS.CONFLICT,
  quoteConvertFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  quoteAlreadyConverted: HTTP_STATUS.CONFLICT,
  quoteNotAccepted: HTTP_STATUS.CONFLICT,
  insufficientStock: HTTP_STATUS.CONFLICT,
  warehouseNotFound: HTTP_STATUS.NOT_FOUND,
  customerNotFound: HTTP_STATUS.NOT_FOUND,
  branchNotFound: HTTP_STATUS.NOT_FOUND,
  productNotFound: HTTP_STATUS.NOT_FOUND,
  variantNotFound: HTTP_STATUS.NOT_FOUND,
  crossTenantResource: HTTP_STATUS.CONFLICT,
};

const MESSAGE_KEY_PATTERNS: ReadonlyArray<
  readonly [needle: string, key: QuoteApiErrorKey]
> = [
  ["cotizacion no encontrada", "quoteNotFound"],
  ["solo se pueden eliminar cotizaciones en borrador", "quoteDeleteNotAllowed"],
  ["ya fue convertida", "quoteAlreadyConverted"],
  ["solo las cotizaciones aceptadas", "quoteNotAccepted"],
  ["stock insuficiente", "insufficientStock"],
  ["almacen no encontrado", "warehouseNotFound"],
  ["cliente no encontrado", "customerNotFound"],
  ["sucursal no encontrada", "branchNotFound"],
  ["producto no encontrado", "productNotFound"],
  ["variante no encontrada", "variantNotFound"],
  ["pertenece a otro tenant", "crossTenantResource"],
];

function isSupportedLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale);
}

function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveRequestLocale(request: NextRequest): AppLocale {
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (localeCookie && isSupportedLocale(localeCookie)) {
    return localeCookie;
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    if (base && isSupportedLocale(base)) {
      return base;
    }
  }

  return routing.defaultLocale;
}

export async function getQuoteApiErrorTranslator(request: NextRequest) {
  const locale = resolveRequestLocale(request);

  return getErrorTranslator<QuoteApiErrorKey>({
    locale,
    namespace: "quotes.errors",
    fallbackNamespace: "common.errors",
  });
}

export function mapQuoteErrorToKey(
  error: unknown,
  fallback: QuoteApiErrorKey,
): QuoteApiErrorKey {
  if (!(error instanceof Error)) return fallback;

  const message = normalizeMessage(error.message);
  for (const [needle, key] of MESSAGE_KEY_PATTERNS) {
    if (message.includes(needle)) return key;
  }

  return fallback;
}

export function getQuoteErrorStatus(key: QuoteApiErrorKey): HttpStatusCode {
  return QUOTE_ERROR_STATUS[key] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
