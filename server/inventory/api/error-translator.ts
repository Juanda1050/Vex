import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getErrorTranslator } from "@/server/error-translator";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";

type AppLocale = (typeof routing.locales)[number];

export type InventoryApiErrorKey =
  | "generic"
  | "invalidPayload"
  | "inventoryListFailed"
  | "inventoryMovementFailed"
  | "inventoryKardexFailed"
  | "warehousesLimitReached"
  | "insufficientStock"
  | "warehouseNotFound"
  | "productNotFound"
  | "variantNotFound"
  | "crossTenantResource";

const INVENTORY_ERROR_STATUS: Record<InventoryApiErrorKey, HttpStatusCode> = {
  generic: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  invalidPayload: HTTP_STATUS.BAD_REQUEST,
  inventoryListFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  inventoryMovementFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  inventoryKardexFailed: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  warehousesLimitReached: HTTP_STATUS.PAYMENT_REQUIRED,
  insufficientStock: HTTP_STATUS.CONFLICT,
  warehouseNotFound: HTTP_STATUS.NOT_FOUND,
  productNotFound: HTTP_STATUS.NOT_FOUND,
  variantNotFound: HTTP_STATUS.NOT_FOUND,
  crossTenantResource: HTTP_STATUS.CONFLICT,
};

const MESSAGE_KEY_PATTERNS: ReadonlyArray<
  readonly [needle: string, key: InventoryApiErrorKey]
> = [
  ["stock insuficiente", "insufficientStock"],
  ["limite del plan alcanzado para warehouseslimit", "warehousesLimitReached"],
  ["almacen no encontrado", "warehouseNotFound"],
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

export async function getInventoryApiErrorTranslator(request: NextRequest) {
  const locale = resolveRequestLocale(request);

  return getErrorTranslator<InventoryApiErrorKey>({
    locale,
    namespace: "inventory.errors",
    fallbackNamespace: "common.errors",
  });
}

export function mapInventoryErrorToKey(
  error: unknown,
  fallback: InventoryApiErrorKey,
): InventoryApiErrorKey {
  if (!(error instanceof Error)) return fallback;

  const message = normalizeMessage(error.message);
  for (const [needle, key] of MESSAGE_KEY_PATTERNS) {
    if (message.includes(needle)) return key;
  }

  return fallback;
}

export function getInventoryErrorStatus(
  key: InventoryApiErrorKey,
): HttpStatusCode {
  return INVENTORY_ERROR_STATUS[key] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
