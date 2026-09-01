"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { AUTH_REDIRECTS } from "../constants";
import {
  getAuthErrorTranslator,
  getFirstValidationKey,
  type AuthActionState,
} from "./actionHelpers";
import { resetPasswordSchema } from "../validations/resetPassword.schema";
import { HTTP_STATUS } from "@/server/httpStatus";

export type ResetPasswordState = AuthActionState;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const errors = await getAuthErrorTranslator();
  const locale = await getLocale();

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
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

  const { error } = await sessionManager.updatePassword(parsed.data.password);

  if (error)
    return {
      error: errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };

  redirect(AUTH_REDIRECTS.login(locale));
}
