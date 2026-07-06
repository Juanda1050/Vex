import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getErrorTranslator } from "@/server/error-translator";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";

type AppLocale = (typeof routing.locales)[number];

export type UserApiErrorKey =
  | "generic"
  | "invalidPayload"
  | "invalidUserId"
  | "invalidBranchId"
  | "usersLimitReached"
  | "userAlreadyMember"
  | "branchNotFound"
  | "userListFailed"
  | "userCreateFailed";

const USER_ERROR_STATUS: Record<UserApiErrorKey, HttpStatusCode> = {
  generic: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  invalidPayload: HTTP_STATUS.BAD_REQUEST,
  invalidUserId: HTTP_STATUS.BAD_REQUEST,
  invalidBranchId: HTTP_STATUS.BAD_REQUEST,
  usersLimitReached: HTTP_STATUS.PAYMENT_REQUIRED,
  userAlreadyMember: HTTP_STATUS.CONFLICT,
  branchNotFound: HTTP_STATUS.NOT_FOUND,
  userListFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  userCreateFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
};

const MESSAGE_KEY_PATTERNS: ReadonlyArray<
  readonly [needle: string, key: UserApiErrorKey]
> = [
  ["limite del plan alcanzado para userslimit", "usersLimitReached"],
  ["ya pertenece al tenant", "userAlreadyMember"],
  ["sucursal no encontrada", "branchNotFound"],
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

export async function getUserApiErrorTranslator(request: NextRequest) {
  const locale = resolveRequestLocale(request);

  return getErrorTranslator<UserApiErrorKey>({
    locale,
    namespace: "users.errors",
    fallbackNamespace: "common.errors",
  });
}

export function mapUserErrorToKey(
  error: unknown,
  fallback: UserApiErrorKey,
): UserApiErrorKey {
  if (!(error instanceof Error)) return fallback;

  const message = normalizeMessage(error.message);
  for (const [needle, key] of MESSAGE_KEY_PATTERNS) {
    if (message.includes(needle)) return key;
  }

  return fallback;
}

export function getUserErrorStatus(key: UserApiErrorKey): HttpStatusCode {
  return USER_ERROR_STATUS[key] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
