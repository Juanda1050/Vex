import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/auth";

import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await requireAuth();
  const [tDashboard, tNav] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("nav"),
  ]);

  const displayName = auth.fullName?.trim() || auth.email;
  const avatarUrl = auth.avatarUrl ?? null;

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
