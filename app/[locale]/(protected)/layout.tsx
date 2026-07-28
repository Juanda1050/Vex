import { getTranslations } from "next-intl/server";
import { permissionChecker, requireAuth } from "@/server/auth";
import { authRepository } from "@/server/auth/repository/auth.repository";

import { AppShell } from "@/components/layout/app-shell";
import { ThemeColorSync } from "@/components/layout/theme-color-sync";
import type { TopNavigationEntry } from "@/components/layout/top-navigation";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await requireAuth();
  const [tDashboard, tNav, profile] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("nav"),
    authRepository.getOrCreateUserProfile(auth.userId),
  ]);

  const displayName = auth.fullName?.trim() || auth.email;
  const avatarUrl = auth.avatarUrl ?? null;

  const canViewUsers = permissionChecker.can(auth.role, "users.view");

  const topNavigationItems: TopNavigationEntry[] = [
    {
      href: `/${locale}/dashboard`,
      label: tNav("dashboard"),
      icon: "dashboard" as const,
    },
    {
      label: tNav("groups.sales"),
      icon: "sales" as const,
      items: [
        {
          href: `/${locale}/pos`,
          label: tNav("posRegister"),
          icon: "pos" as const,
        },
        {
          href: `/${locale}/dashboard/pos`,
          label: tNav("posAnalytics"),
          icon: "pos" as const,
        },
        {
          href: `/${locale}/sales`,
          label: tNav("sales"),
          icon: "sales" as const,
        },
        {
          href: `/${locale}/quotes`,
          label: tNav("quotes"),
          icon: "quotes" as const,
        },
      ],
    },
    {
      href: `/${locale}/customers`,
      label: tNav("customers"),
      icon: "customers" as const,
    },
    {
      label: tNav("groups.catalog"),
      icon: "products" as const,
      items: [
        {
          href: `/${locale}/products`,
          label: tNav("products"),
          icon: "products" as const,
        },
        {
          href: `/${locale}/inventory`,
          label: tNav("inventory"),
          icon: "inventory" as const,
        },
      ],
    },
    ...(canViewUsers
      ? [
          {
            href: `/${locale}/users`,
            label: tNav("users"),
            icon: "users" as const,
          },
        ]
      : []),
    {
      href: `/${locale}/billing/features`,
      label: tNav("billing"),
      icon: "billing" as const,
    },
    {
      href: `/${locale}/settings`,
      label: tNav("settings"),
      icon: "settings" as const,
    },
  ];

  return (
    <>
      <ThemeColorSync accent={profile.themeColor} />
      <AppShell
        locale={locale}
        userName={displayName}
        userEmail={auth.email}
        userAvatarUrl={avatarUrl}
        userMenuAriaLabel={tDashboard("openUserMenu")}
        topNavigationItems={topNavigationItems}
        mobileNavLabel={tNav("menu")}
        mobileNavTriggerLabel={tNav("openMenu")}
        contentFrameless
      >
        {children}
      </AppShell>
    </>
  );
}
