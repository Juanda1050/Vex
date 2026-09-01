import { headers } from "next/headers";
import type { ZodError } from "zod";
import type { HttpStatusCode } from "@/server/httpStatus";
import { getErrorTranslator } from "@/server/errorTranslator";

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

function normalizeAppUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function getAppUrl(): Promise<string | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return normalizeAppUrl(appUrl);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return normalizeAppUrl(`https://${vercelUrl}`);

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";

  if (!host) return null;

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return normalizeAppUrl(`${protocol}://${host}`);
}

export function buildLocalizedAbsoluteUrl(
  appUrl: string,
  locale: string,
  path: string,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appUrl}/${locale}${normalizedPath}`;
}
