"use server";

import { cookies, headers } from "next/headers";
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
} from "./actionHelpers";
import { loginSchema } from "../validations/login.schema";
import { HTTP_STATUS } from "@/server/httpStatus";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RATE_LIMIT_PRESETS,
} from "@/lib/rateLimit";
import { writeAuditLog } from "@/server/auditLog";

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
  const requestHeaders = await headers();
  const rateLimit = await checkRateLimit(
    getRateLimitIdentifier(requestHeaders, email),
    "login",
    RATE_LIMIT_PRESETS.login,
  );

  if (!rateLimit.allowed) {
    return {
      error: errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
    };
  }

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

  const { data, error } = await sessionManager.signInWithPassword(
    email,
    password,
  );

  if (error) {
    await writeAuditLog({
      action: "AUTH_LOGIN_FAILED",
      resourceType: "session",
    });

    return {
      error: errors.fromKey("invalidCredentials"),
      success: false,
      errorKey: "invalidCredentials",
      status: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  await writeAuditLog({
    actorUserId: data.user?.id,
    action: "AUTH_LOGIN_SUCCEEDED",
    resourceType: "session",
  });

  const redirectTo = formData.get("redirectTo") as string | null;
  redirect(sanitizeNextPath(redirectTo, AUTH_REDIRECTS.dashboard(locale)));
}
