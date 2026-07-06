import { getTranslations } from "next-intl/server";
import type { ZodError } from "zod";

export interface AuthActionState {
  error: string | null;
  success: boolean;
}

export function getFirstValidationKey(error: ZodError): string {
  return error.issues[0]?.message ?? "generic";
}

export function translateWithFallback(
  t: (key: string) => string,
  fallback: (key: string) => string,
  key: string,
): string {
  try {
    return t(key);
  } catch {
    return fallback("generic");
  }
}

export async function getAuthErrorTranslator() {
  const tAuth = await getTranslations("auth.errors");
  const tCommon = await getTranslations("common.errors");

  return {
    tAuth,
    tCommon,
    fromKey: (key: string) => translateWithFallback(tAuth, tCommon, key),
    generic: () => tCommon("generic"),
  };
}

export function sanitizeNextPath(
  next: string | null | undefined,
  defaultPath: string,
): string {
  if (!next) return defaultPath;

  // Allow only internal, absolute app paths and block protocol-relative URLs.
  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return defaultPath;
}

export function getAppUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return null;
  return appUrl.replace(/\/+$/, "");
}

export function buildLocalizedAbsoluteUrl(
  appUrl: string,
  locale: string,
  path: string,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appUrl}/${locale}${normalizedPath}`;
}
