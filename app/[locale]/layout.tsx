import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "es" | "en")) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AppShell
        title={locale === "es" ? "Espacio de trabajo" : "Workspace"}
        description={
          locale === "es"
            ? "Interfaz unificada con tema semántico y layout adaptable."
            : "Unified interface with semantic theming and responsive layout."
        }
        sidebar={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{locale.toUpperCase()}</Badge>
            <Badge variant="info">
              {locale === "es" ? "Tema dinámico" : "Dynamic theme"}
            </Badge>
          </div>
        }
      >
        {children}
      </AppShell>
    </NextIntlClientProvider>
  );
}
