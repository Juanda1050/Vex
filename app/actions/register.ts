"use server";

import { createClient } from "@/lib/supabase";
import { TenantService } from "@/server/services/tenant.service";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";
import { getErrorTranslator } from "@/server/error-translator";

const tenantService = new TenantService();

export interface RegisterActionResult {
  success: boolean;
  error: string | null;
  errorKey?: string | null;
  status?: HttpStatusCode;
}

export async function registerAction(
  formData: FormData,
): Promise<RegisterActionResult> {
  const errors = await getErrorTranslator({
    namespace: "auth.errors",
    fallbackNamespace: "common.errors",
  });

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    const key = "userNotCreated";
    return {
      success: false,
      error: error?.message ?? errors.fromKey(key),
      errorKey: key,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  try {
    await tenantService.registerNewCompany(companyName, data.user.id);
    return {
      success: true,
      error: null,
      errorKey: null,
      status: HTTP_STATUS.OK,
    };
  } catch (e) {
    console.error(e);
    const key = "tenantError";
    return {
      success: false,
      error: errors.fromKey(key),
      errorKey: key,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
}
