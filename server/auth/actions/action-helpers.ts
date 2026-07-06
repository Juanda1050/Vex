import type { ZodError } from "zod";
import type { HttpStatusCode } from "@/server/http-status";
import { getErrorTranslator } from "@/server/error-translator";

export interface AuthActionState {
  error: string | null;
  success: boolean;
  errorKey?: string | null;
  status?: HttpStatusCode;
}

export function getFirstValidationKey(error: ZodError): string {
  return error.issues[0]?.message ?? "generic";
}

export async function getAuthErrorTranslator() {
  return getErrorTranslator({
    namespace: "auth.errors",
    fallbackNamespace: "common.errors",
  });
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
