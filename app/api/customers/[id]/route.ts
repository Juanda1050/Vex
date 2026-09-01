import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/server/auth";
import { customerService, updateCustomerSchema } from "@/server/customers";
import {
  getCustomerApiErrorTranslator,
  getCustomerErrorStatus,
  mapCustomerErrorToKey,
  type CustomerApiErrorKey,
} from "@/server/customers/api/errorTranslator";
import { HTTP_STATUS } from "@/server/httpStatus";
import { z } from "zod";

const customerIdSchema = z.string().uuid("invalidCustomerId");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const translator = await getCustomerApiErrorTranslator(request);

  try {
    // Use requirePermissionApi for API routes
    const ctxOrError = await requirePermissionApi("customers.view");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { id } = await context.params;

    // Validate UUID format before using in query
    const parsed = customerIdSchema.safeParse(id);
    if (!parsed.success) {
      const key: CustomerApiErrorKey = "invalidCustomerId";
      const status = getCustomerErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const customer = await customerService.getCustomer(
      ctx.tenantId,
      parsed.data,
    );

    return NextResponse.json({
      ok: true,
      data: customer,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapCustomerErrorToKey(error, "customerFetchFailed");
    const status = getCustomerErrorStatus(key);

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
  const translator = await getCustomerApiErrorTranslator(request);

  try {
    // Use requirePermissionApi for API routes
    const ctxOrError = await requirePermissionApi("customers.edit");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateCustomerSchema.safeParse({
      ...body,
      id,
      tenantId: ctx.tenantId,
    });

    if (!parsed.success) {
      const issueKey = parsed.error.issues[0]?.message;
      const key: CustomerApiErrorKey =
        issueKey === "invalidCustomerId"
          ? "invalidCustomerId"
          : "invalidPayload";
      const status = getCustomerErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const customer = await customerService.updateCustomer(parsed.data);

    return NextResponse.json({
      ok: true,
      data: customer,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapCustomerErrorToKey(error, "customerUpdateFailed");
    const status = getCustomerErrorStatus(key);

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
  const translator = await getCustomerApiErrorTranslator(request);

  try {
    // Use requirePermissionApi for API routes
    const ctxOrError = await requirePermissionApi("customers.delete");
    if (ctxOrError instanceof NextResponse) {
      return ctxOrError;
    }
    const ctx = ctxOrError;
    const { id } = await context.params;
    const parsedId = customerIdSchema.safeParse(id);

    if (!parsedId.success) {
      const key: CustomerApiErrorKey = "invalidCustomerId";
      const status = getCustomerErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    await customerService.deleteCustomer(ctx.tenantId, parsedId.data);

    return NextResponse.json({
      ok: true,
      data: null,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapCustomerErrorToKey(error, "customerDeleteFailed");
    const status = getCustomerErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
