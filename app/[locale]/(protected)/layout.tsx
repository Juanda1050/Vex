import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/auth";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await requireAuth();
  const t = await getTranslations("mvp.layout");

  return (
    <AppShell
      title={t("title")}
      description={t("description")}
      sidebar={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{locale.toUpperCase()}</Badge>
          <Badge variant="info">{t("badge")}</Badge>
          <Badge variant="outline">{auth.role}</Badge>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
