"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AUTH_REDIRECTS } from "../constants";
import { COOKIE_KEYS, COOKIE_OPTIONS } from "../constants/cookies.constants";
import { sessionManager } from "../session/session.manager";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
  sanitizeNextPath,
} from "./action-helpers";

export async function loginWithGoogleAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const cookieStore = await cookies();

  const appUrl = await getAppUrl();
  if (!appUrl) {
    redirect(AUTH_REDIRECTS.login(locale));
  }

  const orgName = (formData.get("orgName") as string | null)?.trim() ?? "";

  if (orgName.length >= 3) {
    cookieStore.set({
      name: COOKIE_KEYS.oauthOrgName,
      value: orgName,
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
      maxAge: 60 * 10,
    });
  } else {
    cookieStore.delete(COOKIE_KEYS.oauthOrgName);
  }

  const redirectToRaw = formData.get("redirectTo") as string | null;
  const nextPath = sanitizeNextPath(
    redirectToRaw,
    AUTH_REDIRECTS.dashboard(locale),
  );

  const callbackBase = buildLocalizedAbsoluteUrl(
    appUrl,
    locale,
    "/auth/callback",
  );
  const callbackUrl = `${callbackBase}?next=${encodeURIComponent(nextPath)}`;

  const { data, error } = await sessionManager.signInWithOAuth(
    "google",
    callbackUrl,
  );

  if (error || !data.url) {
    redirect(AUTH_REDIRECTS.login(locale));
  }

  redirect(data.url);
}
