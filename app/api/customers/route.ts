import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import {
  customerService,
  createCustomerSchema,
  customerFiltersSchema,
} from "@/server/customers";
import {
  getCustomerApiErrorTranslator,
  getCustomerErrorStatus,
  mapCustomerErrorToKey,
  type CustomerApiErrorKey,
} from "@/server/customers/api/error-translator";
import { HTTP_STATUS } from "@/server/http-status";

export async function GET(request: NextRequest) {
  const translator = await getCustomerApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("customers.view");
    const parsed = customerFiltersSchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      isActive: request.nextUrl.searchParams.get("isActive") ?? undefined,
    });

    if (!parsed.success) {
      const key: CustomerApiErrorKey = "invalidPayload";
      const status = getCustomerErrorStatus(key);
      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const customers = await customerService.listCustomers(
      ctx.tenantId,
      parsed.data,
    );

    return NextResponse.json({
      ok: true,
      data: customers.items,
      pagination: customers.pagination,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    const key = mapCustomerErrorToKey(error, "customerListFailed");
    const status = getCustomerErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const translator = await getCustomerApiErrorTranslator(request);

  try {
    const ctx = await requirePermission("customers.create");
    const body = await request.json();
    const parsed = createCustomerSchema.safeParse({
      ...body,
      tenantId: ctx.tenantId,
    });

    if (!parsed.success) {
      const key: CustomerApiErrorKey = "invalidPayload";
      const status = getCustomerErrorStatus(key);

      return NextResponse.json(
        { ok: false, errorKey: key, error: translator.fromKey(key), status },
        { status },
      );
    }

    const customer = await customerService.createCustomer(parsed.data);

    return NextResponse.json(
      { ok: true, data: customer, status: HTTP_STATUS.CREATED },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    const key = mapCustomerErrorToKey(error, "customerCreateFailed");
    const status = getCustomerErrorStatus(key);

    return NextResponse.json(
      { ok: false, errorKey: key, error: translator.fromKey(key), status },
      { status },
    );
  }
}
