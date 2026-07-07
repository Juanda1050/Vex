import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterModulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const onboarding = await getOnboardingState();

  if (onboarding.isAuthenticated) {
    if (onboarding.needsOnboarding) {
      redirect(`/${locale}/onboarding`);
    }

    redirect(`/${locale}/dashboard`);
  }

  const tAuth = await getTranslations("auth");
  const tRegister = await getTranslations("mvp.register");

  return (
    <section className="flex h-full w-full min-h-0 flex-1 flex-col">
      <div className="grid h-full min-h-0 flex-1 items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-5 2xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] 2xl:gap-6">
        <div className="relative hidden h-full min-h-0 overflow-hidden rounded-[1.3rem] border border-border/60 bg-linear-to-br from-info/30 via-primary/25 to-accent/25 p-5 lg:rounded-[1.6rem] lg:p-8 xl:flex xl:flex-col xl:justify-between xl:backdrop-blur-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_12%_12%,hsl(var(--card)/0.92),transparent_32%),radial-gradient(circle_at_68%_28%,hsl(var(--primary)/0.28),transparent_40%),radial-gradient(circle_at_85%_74%,hsl(var(--info)/0.28),transparent_38%)]"
          />
          <div className="relative z-10">
            <p className="text-[clamp(1.9rem,5.5vw,4.2rem)] leading-none font-black tracking-[-0.04em] text-foreground/92">
              START
            </p>
          </div>

          <div
            aria-hidden
            className="relative z-10 mx-auto mt-4 grid size-28 place-items-center rounded-[1.4rem] border border-primary/35 bg-linear-to-b from-primary/65 to-info/65 shadow-[0_16px_40px_hsl(var(--foreground)/0.25)] sm:size-32 lg:mt-5 lg:size-44 lg:rounded-[2.2rem]"
          >
            <div className="size-14 rounded-full border border-background/45 bg-background/20 backdrop-blur-md sm:size-16 lg:size-24" />
          </div>

          <div className="relative z-10 space-y-3">
            <p className="max-w-md text-sm text-foreground/75 sm:text-base">
              {tRegister("heroDescription")}
            </p>
          </div>
        </div>

        <div className="glass-panel glass-glow flex h-full min-h-0 flex-col justify-center rounded-[1.3rem] border border-border/60 p-4 sm:rounded-[1.5rem] sm:p-6 lg:rounded-[1.6rem] lg:p-8">
          <div className="mx-auto w-full max-w-md">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex size-8 items-center justify-center rounded-xl border border-border/70 bg-background/55">
                  <UserPlus className="size-4 text-primary" />
                </div>
                <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
                  {tAuth("register.title")}
                </h1>
              </div>
              <p className="pt-2 text-xs font-semibold tracking-[0.18em] text-foreground/70 uppercase">
                {tRegister("appTypeTitle")}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {tRegister("description")}
              </p>
            </div>

            <div className="mt-5 sm:mt-6">
              <RegisterForm locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
