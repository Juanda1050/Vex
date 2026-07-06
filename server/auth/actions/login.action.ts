"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { AUTH_REDIRECTS } from "../constants";
import {
  getAuthErrorTranslator,
  getFirstValidationKey,
  sanitizeNextPath,
  type AuthActionState,
} from "./action-helpers";
import { loginSchema } from "../validations/login.schema";

export type LoginState = AuthActionState;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const errors = await getAuthErrorTranslator();
  const locale = await getLocale();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const key = getFirstValidationKey(parsed.error);
    return {
      error: errors.fromKey(key),
      success: false,
    };
  }

  const { email, password } = parsed.data;

  const { error } = await sessionManager.signInWithPassword(email, password);

  if (error)
    return { error: errors.fromKey("invalidCredentials"), success: false };

  const redirectTo = formData.get("redirectTo") as string | null;
  redirect(sanitizeNextPath(redirectTo, AUTH_REDIRECTS.dashboard(locale)));
}
