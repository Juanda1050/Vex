import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getErrorTranslator } from "@/server/errorTranslator";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/httpStatus";

type AppLocale = (typeof routing.locales)[number];

export type ProductApiErrorKey =
  | "generic"
  | "invalidPayload"
  | "invalidProductId"
  | "productsLimitReached"
  | "productNotFound"
  | "productCreateFailed"
  | "productUpdateFailed"
  | "productDeleteFailed"
  | "productFetchFailed"
  | "productListFailed";

const PRODUCT_ERROR_STATUS: Record<ProductApiErrorKey, HttpStatusCode> = {
  generic: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  invalidPayload: HTTP_STATUS.BAD_REQUEST,
  invalidProductId: HTTP_STATUS.BAD_REQUEST,
  productsLimitReached: HTTP_STATUS.PAYMENT_REQUIRED,
  productNotFound: HTTP_STATUS.NOT_FOUND,
  productCreateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  productUpdateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  productDeleteFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  productFetchFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  productListFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
};

const MESSAGE_KEY_PATTERNS: ReadonlyArray<
  readonly [needle: string, key: ProductApiErrorKey]
> = [
  ["producto no encontrado", "productNotFound"],
  ["limite del plan alcanzado para productslimit", "productsLimitReached"],
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

export async function getProductApiErrorTranslator(request: NextRequest) {
  const locale = resolveRequestLocale(request);

  return getErrorTranslator<ProductApiErrorKey>({
    locale,
    namespace: "products.errors",
    fallbackNamespace: "common.errors",
  });
}

export function mapProductErrorToKey(
  error: unknown,
  fallback: ProductApiErrorKey,
): ProductApiErrorKey {
  if (!(error instanceof Error)) return fallback;

  const message = normalizeMessage(error.message);
  for (const [needle, key] of MESSAGE_KEY_PATTERNS) {
    if (message.includes(needle)) return key;
  }

  return fallback;
}

export function getProductErrorStatus(key: ProductApiErrorKey): HttpStatusCode {
  return PRODUCT_ERROR_STATUS[key] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
