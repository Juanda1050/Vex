import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";
import { getErrorTranslator } from "@/server/error-translator";

type AppLocale = (typeof routing.locales)[number];

type SubscriptionApiErrorKey =
  | "generic"
  | "plansFetchFailed"
  | "currentFetchFailed"
  | "changeFailed"
  | "cancelFailed"
  | "reactivateFailed"
  | "invalidPayload"
  | "planCodeRequired"
  | "invalidPriceId"
  | "billingAccessDenied"
  | "planNotAvailable"
  | "invalidPlanPrice"
  | "noActiveSubscriptionToCancel"
  | "noActiveSubscriptionToReactivate";

const SUPPORTED_LOCALES = new Set<AppLocale>(routing.locales);

const SUBSCRIPTION_ERROR_STATUS: Record<
  SubscriptionApiErrorKey,
  HttpStatusCode
> = {
  generic: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  plansFetchFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  currentFetchFailed: HTTP_STATUS.UNAUTHORIZED,
  changeFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  cancelFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  reactivateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  invalidPayload: HTTP_STATUS.BAD_REQUEST,
  planCodeRequired: HTTP_STATUS.BAD_REQUEST,
  invalidPriceId: HTTP_STATUS.BAD_REQUEST,
  billingAccessDenied: HTTP_STATUS.FORBIDDEN,
  planNotAvailable: HTTP_STATUS.NOT_FOUND,
  invalidPlanPrice: HTTP_STATUS.BAD_REQUEST,
  noActiveSubscriptionToCancel: HTTP_STATUS.NOT_FOUND,
  noActiveSubscriptionToReactivate: HTTP_STATUS.NOT_FOUND,
};

const MESSAGE_KEY_PATTERNS: ReadonlyArray<
  readonly [needle: string, key: SubscriptionApiErrorKey]
> = [
  ["plan no disponible", "planNotAvailable"],
  ["precio seleccionado no pertenece", "invalidPlanPrice"],
  [
    "no existe una suscripcion activa para cancelar",
    "noActiveSubscriptionToCancel",
  ],
  [
    "no existe una suscripcion activa para reactivar",
    "noActiveSubscriptionToReactivate",
  ],
  ["no tienes permisos para administrar la suscripcion", "billingAccessDenied"],
];

function isSupportedLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.has(locale as AppLocale);
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

export async function getSubscriptionApiErrorTranslator(request: NextRequest) {
  const locale = resolveRequestLocale(request);
  return getSubscriptionErrorTranslatorByLocale(locale);
}

export async function getSubscriptionErrorTranslatorByLocale(locale: string) {
  return getErrorTranslator<SubscriptionApiErrorKey>({
    locale,
    namespace: "subscriptions.errors",
    fallbackNamespace: "common.errors",
  });
}

export function getSubscriptionErrorStatus(
  key: SubscriptionApiErrorKey,
): HttpStatusCode {
  return SUBSCRIPTION_ERROR_STATUS[key] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

export function mapSubscriptionErrorToKey(
  error: unknown,
  fallback: SubscriptionApiErrorKey,
): SubscriptionApiErrorKey {
  if (!(error instanceof Error)) return fallback;

  const message = normalizeMessage(error.message);

  for (const [needle, key] of MESSAGE_KEY_PATTERNS) {
    if (message.includes(needle)) return key;
  }

  return fallback;
}

export type { SubscriptionApiErrorKey };
