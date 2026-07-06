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
    <main className="relative flex min-h-screen flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-7 xl:px-10 xl:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_8%_8%,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_90%_6%,hsl(var(--info)/0.16),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.28))]"
      />
      <div className="relative flex w-full flex-wrap items-center justify-end gap-2">
        <LanguageSwitcher locale={locale} />
        <ThemeToggle />
      </div>
      <div className="glass-panel glass-glow relative mt-3 flex w-full min-h-0 flex-1 rounded-[1.5rem] p-2.5 sm:mt-4 sm:rounded-[2rem] sm:p-4 lg:p-6">
        <div className="mx-auto flex w-full min-h-0 flex-1 2xl:max-w-[1700px]">
          {children}
        </div>
      </div>
    </main>
  );
}
