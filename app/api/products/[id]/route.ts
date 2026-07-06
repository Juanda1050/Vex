import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { productService, updateProductSchema } from "@/server/products";
import {
  getProductApiErrorTranslator,
  getProductErrorStatus,
  mapProductErrorToKey,
  type ProductApiErrorKey,
} from "@/server/products/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";
import { z } from "zod";

const productIdSchema = z.string().uuid("invalidProductId");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const translator = await getProductApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("products.view");
    const { id } = await context.params;

    const product = await productService.getProduct(ctx.tenantId, id);

    return NextResponse.json({
      ok: true,
      data: product,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapProductErrorToKey(error, "productFetchFailed");
    const status = getProductErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const translator = await getProductApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("products.edit");
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateProductSchema.safeParse({
      ...body,
      id,
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

    const product = await productService.updateProduct(parsed.data);

    return NextResponse.json({
      ok: true,
      data: product,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapProductErrorToKey(error, "productUpdateFailed");
    const status = getProductErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const translator = await getProductApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("products.delete");
    const { id } = await context.params;
    const parsedId = productIdSchema.safeParse(id);

    if (!parsedId.success) {
      const key: ProductApiErrorKey = "invalidProductId";
      const status = getProductErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    await productService.deleteProduct(ctx.tenantId, parsedId.data);

    return NextResponse.json({
      ok: true,
      data: null,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapProductErrorToKey(error, "productDeleteFailed");
    const status = getProductErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
