import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/auth";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await requireAuth();
  const supabase = await createClient();
  const [tDashboard, tNav] = await Promise.all([
    getTranslations("mvp.dashboard"),
    getTranslations("nav"),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata as
    Record<string, string | undefined> | undefined;

  const displayName =
    metadata?.full_name?.trim() ||
    metadata?.name?.trim() ||
    metadata?.user_name?.trim() ||
    auth.email;

  const avatarUrl =
    metadata?.avatar_url?.trim() || metadata?.picture?.trim() || null;

  const topNavigationItems = [
    { href: `/${locale}/dashboard`, label: tNav("dashboard") },
    { href: `/${locale}/settings`, label: tNav("settings") },
  ];

  return (
    <AppShell
      locale={locale}
      userName={displayName}
      userEmail={auth.email}
      userAvatarUrl={avatarUrl}
      userMenuAriaLabel={tDashboard("openUserMenu")}
      topNavigationItems={topNavigationItems}
      contentFrameless
    >
      {children}
    </AppShell>
  );
}
