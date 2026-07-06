"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AUTH_REDIRECTS } from "../constants";
import { authRepository } from "../repository/auth.repository";
import { sessionManager } from "../session/session.manager";
import {
  getAuthErrorTranslator,
  getFirstValidationKey,
  sanitizeNextPath,
} from "./action-helpers";
import { verifyEmailSchema } from "../validations/verify-email.schema";

const DEFAULT_VERIFY_TYPE: EmailOtpType = "signup";

type VerifyEmailParams = {
  token_hash?: string | null;
  type?: string | null;
  code?: string | null;
  next?: string | null;
};

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

  const member = await authRepository.findMemberByUserId(user.id);
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
