"use server";

import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { TenantService } from "@/server/tenant";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
  getAuthErrorTranslator,
  getFirstValidationKey,
  type AuthActionState,
} from "./action-helpers";
import { registerSchema } from "../validations/register.schema";
import { HTTP_STATUS } from "@/server/http-status";

export type RegisterState = AuthActionState;

const tenantService = new TenantService();

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const errors = await getAuthErrorTranslator();
  const locale = await getLocale();

  const parsed = registerSchema.safeParse({
    orgName: formData.get("orgName"),
    email: formData.get("email"),
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

  const { orgName, email, password } = parsed.data;

  const appUrl = await getAppUrl();
  if (!appUrl)
    return {
      error: errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };

  const callbackUrl = buildLocalizedAbsoluteUrl(
    appUrl,
    locale,
    "/auth/callback",
  );
  const { data, error } = await sessionManager.signUp(
    email,
    password,
    callbackUrl,
  );

  if (error)
    return {
      error: error.message ?? errors.generic(),
      success: false,
      errorKey: "generic",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  if (!data.user)
    return {
      error: errors.fromKey("userNotCreated"),
      success: false,
      errorKey: "userNotCreated",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };

  try {
    await tenantService.registerNewCompany(orgName, data.user.id);
  } catch {
    return {
      error: errors.fromKey("tenantError"),
      success: false,
      errorKey: "tenantError",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  return { error: null, success: true, errorKey: null, status: HTTP_STATUS.OK };
}
