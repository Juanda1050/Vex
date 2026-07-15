import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";
import { AuthModulePanel } from "@/components/auth/auth-module-panel";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
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
  const tRegister = await getTranslations("authShowcase.register");

  const showcaseCharts = {
    slide1Label: tRegister("charts.slide1Label"),
    slide1Value: tRegister("charts.slide1Value"),
    slide1Delta: tRegister("charts.slide1Delta"),
    slide1StageDraft: tRegister("charts.slide1StageDraft"),
    slide1StageSent: tRegister("charts.slide1StageSent"),
    slide1StageWon: tRegister("charts.slide1StageWon"),
    slide1Note: tRegister("charts.slide1Note"),
    slide2Label: tRegister("charts.slide2Label"),
    slide2Value: tRegister("charts.slide2Value"),
    slide2Delta: tRegister("charts.slide2Delta"),
    slide2AxisStart: tRegister("charts.slide2AxisStart"),
    slide2AxisEnd: tRegister("charts.slide2AxisEnd"),
    slide3Label: tRegister("charts.slide3Label"),
    slide3Value: tRegister("charts.slide3Value"),
    slide3Delta: tRegister("charts.slide3Delta"),
    slide3CategoryA: tRegister("charts.slide3CategoryA"),
    slide3CategoryB: tRegister("charts.slide3CategoryB"),
    slide3CategoryC: tRegister("charts.slide3CategoryC"),
    slide3CategoryD: tRegister("charts.slide3CategoryD"),
  };

  return (
    <section className="flex h-full w-full min-h-0 flex-1 flex-col">
      <div className="grid h-full min-h-0 flex-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-5 2xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] 2xl:gap-6">
        <AuthShowcasePanel
          brandName={tRegister("brandName")}
          brandSlogan={tRegister("brandSlogan")}
          heroDescription={tRegister("heroDescription")}
          charts={showcaseCharts}
        />

        <AuthModulePanel
          icon={<UserPlus className="size-4 text-primary" />}
          title={tAuth("register.title")}
          appTypeTitle={tRegister("appTypeTitle")}
          description={tRegister("description")}
          footerText={tAuth("register.hasAccount")}
          footerActionLabel={tAuth("register.login")}
          footerHref={`/${locale}/login`}
        >
          <RegisterForm locale={locale} showFooter={false} />
        </AuthModulePanel>
      </div>
    </section>
  );
}
