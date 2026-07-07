"use server";

import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
  getAuthErrorTranslator,
  getFirstValidationKey,
  type AuthActionState,
} from "./action-helpers";
import { forgotPasswordSchema } from "../validations/forgot-password.schema";
import { HTTP_STATUS } from "@/server/http-status";

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
