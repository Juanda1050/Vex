"use server";

import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { TenantService } from "@/server/services/tenant.service";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
  getAuthErrorTranslator,
  getFirstValidationKey,
  type AuthActionState,
} from "./action-helpers";
import { registerSchema } from "../validations/register.schema";

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
    };
  }

  const { orgName, email, password } = parsed.data;

  const appUrl = getAppUrl();
  if (!appUrl) return { error: errors.generic(), success: false };

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
    return { error: error.message ?? errors.generic(), success: false };
  if (!data.user)
    return { error: errors.fromKey("userNotCreated"), success: false };

  try {
    await tenantService.registerNewCompany(orgName, data.user.id);
  } catch {
    return { error: errors.fromKey("tenantError"), success: false };
  }

  return { error: null, success: true };
}
