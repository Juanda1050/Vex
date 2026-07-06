import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getErrorTranslator } from "@/server/error-translator";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";

type AppLocale = (typeof routing.locales)[number];

export type CustomerApiErrorKey =
  | "generic"
  | "invalidPayload"
  | "invalidCustomerId"
  | "customerNotFound"
  | "customerCreateFailed"
  | "customerUpdateFailed"
  | "customerDeleteFailed"
  | "customerFetchFailed"
  | "customerListFailed";

const CUSTOMER_ERROR_STATUS: Record<CustomerApiErrorKey, HttpStatusCode> = {
  generic: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  invalidPayload: HTTP_STATUS.BAD_REQUEST,
  invalidCustomerId: HTTP_STATUS.BAD_REQUEST,
  customerNotFound: HTTP_STATUS.NOT_FOUND,
  customerCreateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  customerUpdateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  customerDeleteFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  customerFetchFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  customerListFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
};

const MESSAGE_KEY_PATTERNS: ReadonlyArray<
  readonly [needle: string, key: CustomerApiErrorKey]
> = [["cliente no encontrado", "customerNotFound"]];

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

export async function getCustomerApiErrorTranslator(request: NextRequest) {
  const locale = resolveRequestLocale(request);

  return getErrorTranslator<CustomerApiErrorKey>({
    locale,
    namespace: "customers.errors",
    fallbackNamespace: "common.errors",
  });
}

export function mapCustomerErrorToKey(
  error: unknown,
  fallback: CustomerApiErrorKey,
): CustomerApiErrorKey {
  if (!(error instanceof Error)) return fallback;

  const message = normalizeMessage(error.message);
  for (const [needle, key] of MESSAGE_KEY_PATTERNS) {
    if (message.includes(needle)) return key;
  }

  return fallback;
}

export function getCustomerErrorStatus(
  key: CustomerApiErrorKey,
): HttpStatusCode {
  return CUSTOMER_ERROR_STATUS[key] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
