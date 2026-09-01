import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../../lib/prisma";
import { logError } from "@/lib/logSanitizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ValidatePromoCodeBody {
  code?: string;
  appliedCode?: string | null;
  interval?: "month" | "year";
}

interface PromoCodeRow {
  code: string;
  discountPercent: number;
  appliesToInterval: string | null;
  expiryDate: Date;
  isActive: boolean;
  updatedAt: Date;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function POST(request: NextRequest) {
  let body: ValidatePromoCodeBody;

  try {
    body = (await request.json()) as ValidatePromoCodeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_CODE", message: "Invalid code" },
      { status: 400 },
    );
  }

  try {
    const rawCode = body.code ?? "";
    const code = normalizeCode(rawCode);
    const appliedCode = body.appliedCode
      ? normalizeCode(body.appliedCode)
      : null;
    const interval = body.interval;

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "INVALID_CODE", message: "Invalid code" },
        { status: 400 },
      );
    }

    if (appliedCode && code === appliedCode) {
      return NextResponse.json(
        { ok: false, error: "ALREADY_APPLIED", message: "Already applied" },
        { status: 409 },
      );
    }

    if (interval !== "month" && interval !== "year") {
      return NextResponse.json(
        { ok: false, error: "INVALID_CODE", message: "Invalid code" },
        { status: 400 },
      );
    }

    const selectedBillingInterval = interval === "month" ? "MONTH" : "YEAR";

    const promoCodeDelegate = (prisma as unknown as { promoCode?: unknown })
      .promoCode as
      | {
          findMany: (args: unknown) => Promise<PromoCodeRow[]>;
        }
      | undefined;

    const promoCodes = promoCodeDelegate
      ? await promoCodeDelegate.findMany({
          where: {
            code: {
              equals: code,
              mode: "insensitive",
            },
          },
          select: {
            code: true,
            discountPercent: true,
            appliesToInterval: true,
            expiryDate: true,
            isActive: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
      : await prisma.$queryRaw<PromoCodeRow[]>`
          SELECT
            "code",
            "discountPercent",
            "appliesToInterval",
            "expiryDate",
            "isActive",
            "updatedAt"
          FROM "promo_codes"
          WHERE UPPER("code") = UPPER(${code})
          ORDER BY "updatedAt" DESC
        `;

    if (promoCodes.length === 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_CODE", message: "Invalid code" },
        { status: 404 },
      );
    }

    const activePromoCodes = promoCodes.filter(
      (promoCode) => promoCode.isActive,
    );

    if (activePromoCodes.length === 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_CODE", message: "Invalid code" },
        { status: 404 },
      );
    }

    const intervalCompatibleCodes = activePromoCodes.filter(
      (promoCode) =>
        !promoCode.appliesToInterval ||
        promoCode.appliesToInterval === selectedBillingInterval,
    );

    if (intervalCompatibleCodes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "INTERVAL_NOT_ALLOWED",
          message: "Code not valid for selected billing interval",
        },
        { status: 422 },
      );
    }

    const now = Date.now();
    const validPromoCode = intervalCompatibleCodes.find(
      (promoCode) => new Date(promoCode.expiryDate).getTime() >= now,
    );

    if (!validPromoCode) {
      return NextResponse.json(
        { ok: false, error: "EXPIRED_CODE", message: "Expired code" },
        { status: 410 },
      );
    }

    return NextResponse.json({
      ok: true,
      code: validPromoCode.code,
      discountPercent: validPromoCode.discountPercent,
      applicableInterval:
        validPromoCode.appliesToInterval === "MONTH"
          ? "month"
          : validPromoCode.appliesToInterval === "YEAR"
            ? "year"
            : null,
    });
  } catch (error) {
    logError("Promo code validation failed", error);
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined;

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Unable to validate promo code",
        detail,
      },
      { status: 500 },
    );
  }
}
