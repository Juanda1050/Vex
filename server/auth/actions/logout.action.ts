"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { sessionManager } from "../session/session.manager";
import { cookieManager } from "../cookies/cookie.manager";
import { AUTH_REDIRECTS } from "../constants";

export async function logoutAction(): Promise<void> {
  const locale = await getLocale();

  await sessionManager.signOut();
  await cookieManager.clearAll();

  redirect(AUTH_REDIRECTS.login(locale));
}
