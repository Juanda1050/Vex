import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_8%_8%,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_90%_6%,hsl(var(--info)/0.16),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.28))]"
      />
      <div className="relative mx-auto flex w-full max-w-375 justify-end gap-2">
        <LanguageSwitcher locale={locale} />
        <ThemeToggle />
      </div>
      <div className="glass-panel glass-glow relative mx-auto mt-5 w-full max-w-375 rounded-3xl p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}
