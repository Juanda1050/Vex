"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AUTH_REDIRECTS } from "../constants";
import { sessionManager } from "../session/session.manager";
import {
  buildLocalizedAbsoluteUrl,
  getAppUrl,
  sanitizeNextPath,
} from "./action-helpers";

export async function loginWithGoogleAction(formData: FormData): Promise<void> {
  const locale = await getLocale();

  const appUrl = getAppUrl();
  if (!appUrl) {
    redirect(AUTH_REDIRECTS.login(locale));
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
