import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/server/auth";
import {
  productService,
  createProductSchema,
  productFiltersSchema,
} from "@/server/products";
import {
  enforceSubscriptionLimit,
  requireSubscriptionFeature,
} from "@/server/subscriptions";
import {
  getProductApiErrorTranslator,
  getProductErrorStatus,
  mapProductErrorToKey,
  type ProductApiErrorKey,
} from "@/server/products/api/errorTranslator";
import { HTTP_STATUS } from "@/server/httpStatus";

export async function GET(request: NextRequest) {
  const translator = await getProductApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("products.view");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const parsed = productFiltersSchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      categoryId: request.nextUrl.searchParams.get("categoryId") ?? undefined,
      brandId: request.nextUrl.searchParams.get("brandId") ?? undefined,
      unitId: request.nextUrl.searchParams.get("unitId") ?? undefined,
      isActive: request.nextUrl.searchParams.get("isActive") ?? undefined,
    });

    if (!parsed.success) {
      const key: ProductApiErrorKey = "invalidPayload";
      const status = getProductErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const products = await productService.listProducts(
      ctx.tenantId,
      parsed.data,
    );

    return NextResponse.json({
      ok: true,
      data: products.items,
      pagination: products.pagination,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapProductErrorToKey(error, "productListFailed");
    const status = getProductErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const translator = await getProductApiErrorTranslator(request);

  try {
    const ctxOrError = await requirePermissionApi("products.create");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { subscription } = await requireSubscriptionFeature("productsLimit");

    const usedProducts = await productService.countActiveProducts(ctx.tenantId);
    enforceSubscriptionLimit(
      subscription,
      "productsLimit",
      usedProducts,
      "Limite del plan alcanzado para productsLimit.",
    );

    const body = await request.json();
    const parsed = createProductSchema.safeParse({
      ...body,
      tenantId: ctx.tenantId,
    });

    if (!parsed.success) {
      const issueKey = parsed.error.issues[0]?.message;
      const key: ProductApiErrorKey =
        issueKey === "invalidProductId" ? "invalidProductId" : "invalidPayload";
      const status = getProductErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const product = await productService.createProduct(parsed.data);

    return NextResponse.json(
      { ok: true, data: product, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    const key = mapProductErrorToKey(error, "productCreateFailed");
    const status = getProductErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
