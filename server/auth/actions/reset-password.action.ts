"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { AUTH_REDIRECTS } from "../constants";
import {
  getAuthErrorTranslator,
  getFirstValidationKey,
  type AuthActionState,
} from "./action-helpers";
import { resetPasswordSchema } from "../validations/reset-password.schema";

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
    };
  }

  const { error } = await sessionManager.updatePassword(parsed.data.password);

  if (error) return { error: errors.generic(), success: false };

  redirect(AUTH_REDIRECTS.login(locale));
}
