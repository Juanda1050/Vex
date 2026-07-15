import { Suspense } from "react";

import { PublicControls } from "@/components/layout/public-controls";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-5 lg:px-7 lg:py-7 xl:px-8 xl:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_8%_8%,hsl(var(--primary)/0.12),transparent_30%),radial-gradient(circle_at_90%_6%,hsl(var(--foreground)/0.06),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.28))]"
      />
      <div className="glass-panel glass-glow relative mt-2.5 flex w-full min-h-0 flex-1 rounded-[1.5rem] p-2.5 sm:mt-3.5 sm:rounded-[2rem] sm:p-4 lg:p-5 xl:p-6">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col 2xl:max-w-[1880px]">
          <Suspense fallback={null}>
            <PublicControls locale={locale} />
          </Suspense>
          <div className="flex min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </main>
  );
}
