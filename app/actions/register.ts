"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase";
import { TenantService } from "@/server/tenant";
import { HTTP_STATUS, type HttpStatusCode } from "@/server/http-status";
import { getErrorTranslator } from "@/server/error-translator";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { logError } from "@/lib/log-sanitizer";

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

  // Get client IP for rate limiting (use email as fallback identifier)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const identifier = ip !== "unknown" ? ip : email;

  // Check rate limit for registration
  const rateLimit = await checkRateLimit(
    identifier,
    "register",
    RATE_LIMIT_PRESETS.register,
  );

  if (!rateLimit.allowed) {
    const key = "tooManyRegistrationAttempts";
    return {
      success: false,
      error: errors.fromKey(key),
      errorKey: key,
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    const key = "userNotCreated";
    return {
      success: false,
      error: errors.fromKey(key),
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
    logError("Company registration failed", e, {
      email: "[REDACTED]",
      companyName,
    });
    const key = "tenantError";
    return {
      success: false,
      error: errors.fromKey(key),
      errorKey: key,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
}
