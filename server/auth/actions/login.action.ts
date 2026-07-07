"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { AUTH_REDIRECTS } from "../constants";
import { COOKIE_KEYS, COOKIE_OPTIONS } from "../constants/cookies.constants";
import {
  getAuthErrorTranslator,
  getFirstValidationKey,
  sanitizeNextPath,
  type AuthActionState,
} from "./action-helpers";
import { loginSchema } from "../validations/login.schema";
import { HTTP_STATUS } from "@/server/http-status";

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
      errorKey: key,
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const { email, password } = parsed.data;
  const remember = formData.get("remember") === "true";

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_KEYS.rememberSession,
    value: remember ? "1" : "0",
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
    ...(remember ? { maxAge: COOKIE_OPTIONS.maxAge } : {}),
  });

  const { error } = await sessionManager.signInWithPassword(email, password);

  if (error)
    return {
      error: errors.fromKey("invalidCredentials"),
      success: false,
      errorKey: "invalidCredentials",
      status: HTTP_STATUS.UNAUTHORIZED,
    };

  const redirectTo = formData.get("redirectTo") as string | null;
  redirect(sanitizeNextPath(redirectTo, AUTH_REDIRECTS.dashboard(locale)));
}
