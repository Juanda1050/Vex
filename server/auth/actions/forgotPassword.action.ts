"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
  getAuthErrorTranslator,
  getFirstValidationKey,
  type AuthActionState,
} from "./actionHelpers";
import { forgotPasswordSchema } from "../validations/forgotPassword.schema";
import { HTTP_STATUS } from "@/server/httpStatus";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RATE_LIMIT_PRESETS,
} from "@/lib/rateLimit";

export type ForgotPasswordState = AuthActionState;

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const errors = await getAuthErrorTranslator();
  const locale = await getLocale();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const key = getFirstValidationKey(parsed.error);
    return {
      error: errors.fromKey(key),
      success: false,
      errorKey: key,
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const requestHeaders = await headers();
  const rateLimit = await checkRateLimit(
    getRateLimitIdentifier(requestHeaders, parsed.data.email),
    "forgot-password",
    RATE_LIMIT_PRESETS.forgotPassword,
  );

  if (!rateLimit.allowed) {
    return {
      error: errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
    };
  }

  const appUrl = await getAppUrl();
  if (!appUrl)
    return {
      error: errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };

  const redirectTo = buildLocalizedAbsoluteUrl(
    appUrl,
    locale,
    "/reset-password",
  );

  const { error } = await sessionManager.resetPasswordForEmail(
    parsed.data.email,
    redirectTo,
  );

  if (error)
    return {
      error: errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };

  return { error: null, success: true, errorKey: null, status: HTTP_STATUS.OK };
}
