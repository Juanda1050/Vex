import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const onboarding = await getOnboardingState();

  if (onboarding.isAuthenticated) {
    if (onboarding.needsOnboarding) {
      redirect(`/${locale}/onboarding`);
    }

    redirect(`/${locale}/dashboard`);
  }

  const tAuth = await getTranslations("auth");
  const tLogin = await getTranslations("mvp.login");

  return (
    <section className="flex h-full w-full min-h-0 flex-1 flex-col">
      <div className="grid h-full min-h-0 flex-1 items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-5 2xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] 2xl:gap-6">
        <div className="relative hidden h-full min-h-0 overflow-hidden rounded-[1.3rem] border border-border/60 bg-linear-to-br from-primary/30 via-accent/30 to-info/25 p-5 lg:rounded-[1.6rem] lg:p-8 xl:flex xl:flex-col xl:justify-between xl:backdrop-blur-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_18%_16%,hsl(var(--card)/0.92),transparent_34%),radial-gradient(circle_at_75%_22%,hsl(var(--primary)/0.34),transparent_44%),radial-gradient(circle_at_82%_74%,hsl(var(--info)/0.26),transparent_40%)]"
          />
          <div className="relative z-10">
            <p className="text-[clamp(2rem,6vw,4.8rem)] leading-none font-black tracking-[-0.04em] text-foreground/92">
              COTIFY
            </p>
          </div>

          <div
            aria-hidden
            className="relative z-10 mx-auto mt-4 grid size-28 place-items-center rounded-full border border-primary/45 bg-linear-to-b from-primary/70 to-info/70 shadow-[0_16px_40px_hsl(var(--foreground)/0.25)] sm:size-32 lg:mt-5 lg:size-44"
          >
            <div className="size-16 rounded-full border border-background/45 bg-background/20 backdrop-blur-md sm:size-20 lg:size-28" />
          </div>

          <div className="relative z-10 space-y-3">
            <p className="max-w-md text-sm text-foreground/75 sm:text-base">
              {tLogin("heroDescription")}
            </p>
          </div>
        </div>

        <div className="glass-panel glass-glow flex h-full min-h-0 flex-col rounded-[1.3rem] border border-border/60 p-4 sm:rounded-[1.5rem] sm:p-6 lg:rounded-[1.6rem] lg:p-8">
          <div className="mt-1 space-y-1.5 sm:mt-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex size-8 items-center justify-center rounded-xl border border-border/70 bg-background/55">
                <ShieldCheck className="size-4 text-primary" />
              </div>
              <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
                {tAuth("login.title")}
              </h1>
            </div>
            <p className="pt-2 text-xs font-semibold tracking-[0.18em] text-foreground/70 uppercase">
              {tLogin("appTypeTitle")}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {tLogin("description")}
            </p>
          </div>

          <div className="mt-4 flex-1 sm:mt-6">
            <LoginForm locale={locale} redirectTo={query.redirectTo} />
          </div>
        </div>
      </div>
    </section>
  );
}
