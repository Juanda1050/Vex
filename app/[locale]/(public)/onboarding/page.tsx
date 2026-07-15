import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { OnboardingPlanSelectorStatic } from "@/components/onboarding/plan-selector-static";
import { getOnboardingState } from "@/server/auth";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("onboarding");
  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated) {
    redirect(`/${locale}/login`);
  }

  if (!onboarding.needsOnboarding) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto grid w-full max-w-[116rem] gap-6 lg:gap-8">
      <section className="space-y-2.5">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {t("headline")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl xl:text-[2.85rem]">
          {t("title")}
        </h1>
        <p className="max-w-5xl text-sm leading-7 text-foreground/80 dark:text-foreground/86 sm:text-base xl:text-[1.05rem]">
          {t("descriptionCompact")}
        </p>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl xl:text-[2rem]">
            {t("plans.title")}
          </h2>
        </div>
        <OnboardingPlanSelectorStatic locale={locale} />
      </section>
    </div>
  );
}
