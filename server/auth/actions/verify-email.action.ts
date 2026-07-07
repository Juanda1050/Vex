"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AUTH_REDIRECTS } from "../constants";
import { COOKIE_KEYS } from "../constants/cookies.constants";
import { authRepository } from "../repository/auth.repository";
import { sessionManager } from "../session/session.manager";
import { TenantService } from "@/server/tenant";
import {
  getAuthErrorTranslator,
  getFirstValidationKey,
  sanitizeNextPath,
} from "./action-helpers";
import { verifyEmailSchema } from "../validations/verify-email.schema";

const DEFAULT_VERIFY_TYPE: EmailOtpType = "signup";
const tenantService = new TenantService();

type VerifyEmailParams = {
  token_hash?: string | null;
  type?: string | null;
  code?: string | null;
  next?: string | null;
};

function getDefaultCompanyNameFromEmail(email: string | null): string {
  if (!email) return "My Company";

  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "My Company";

  const withCapital = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `${withCapital} Company`;
}

export async function resolveVerifyEmailDestination(
  params: VerifyEmailParams,
  locale: string,
): Promise<string> {
  const errors = await getAuthErrorTranslator();

  const parsed = verifyEmailSchema.safeParse({
    token_hash: params.token_hash ?? undefined,
    type: params.type ?? undefined,
    code: params.code ?? undefined,
    next: params.next ?? undefined,
  });

  const loginRedirect = AUTH_REDIRECTS.login(locale);

  if (!parsed.success) {
    const key = getFirstValidationKey(parsed.error);
    const message = errors.fromKey(key);
    return `${loginRedirect}?error=${encodeURIComponent(message)}`;
  }

  const data = parsed.data;

  if (data.code) {
    const { error } = await sessionManager.exchangeCodeForSession(data.code);
    if (error) {
      const message = errors.fromKey("invalidVerificationLink");
      return `${loginRedirect}?error=${encodeURIComponent(message)}`;
    }
  } else {
    const { error } = await sessionManager.verifyOtp(
      data.token_hash!,
      (data.type ?? DEFAULT_VERIFY_TYPE) as EmailOtpType,
    );

    if (error) {
      const message = errors.fromKey("invalidVerificationLink");
      return `${loginRedirect}?error=${encodeURIComponent(message)}`;
    }
  }

  const { user } = await sessionManager.getUser();
  if (!user) return loginRedirect;

  const cookieStore = await cookies();
  const oauthOrgName = cookieStore.get(COOKIE_KEYS.oauthOrgName)?.value?.trim();

  let member = await authRepository.findMemberByUserId(user.id);

  if (!member) {
    try {
      await tenantService.registerNewCompany(
        oauthOrgName || getDefaultCompanyNameFromEmail(user.email),
        user.id,
      );
      member = await authRepository.findMemberByUserId(user.id);
    } catch {
      cookieStore.delete(COOKIE_KEYS.oauthOrgName);
      const message = errors.fromKey("tenantError");
      return `${loginRedirect}?error=${encodeURIComponent(message)}`;
    }
  }

  cookieStore.delete(COOKIE_KEYS.oauthOrgName);

  const fallbackDestination = member
    ? AUTH_REDIRECTS.dashboard(locale)
    : AUTH_REDIRECTS.onboarding(locale);

  return sanitizeNextPath(data.next, fallbackDestination);
}

export async function verifyEmailAction(
  params: VerifyEmailParams,
  localeOverride?: string,
): Promise<void> {
  const locale = localeOverride ?? (await getLocale());
  const destination = await resolveVerifyEmailDestination(params, locale);
  redirect(destination);
}
