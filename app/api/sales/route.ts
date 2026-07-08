import { Prisma, SaleStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/server/auth";
import { HTTP_STATUS } from "@/server/http-status";
import { createPaginationMeta } from "@/server/pagination";

const salesFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(SaleStatus).optional(),
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const ctx = await requirePermission("sales.view");

    const parsed = salesFiltersSchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      branchId: request.nextUrl.searchParams.get("branchId") ?? undefined,
      customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          errorKey: "invalidPayload",
          error: "Invalid sales filter payload.",
          status: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const filters = parsed.data;
    const skip = (filters.page - 1) * filters.pageSize;

    const where: Prisma.SaleWhereInput = {
      tenantId: ctx.tenantId,
      status: filters.status,
      branchId: filters.branchId,
      customerId: filters.customerId,
      OR: filters.search
        ? [
            {
              number: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              notes: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              customer: {
                name: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            },
          ]
        : undefined,
    };

    const [total, items] = await prisma.$transaction([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: [{ saleDate: "desc" }],
        skip,
        take: filters.pageSize,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: items,
      pagination: createPaginationMeta(filters.page, filters.pageSize, total),
      status: HTTP_STATUS.OK,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errorKey: "salesListFailed",
        error: "Unable to list sales.",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
