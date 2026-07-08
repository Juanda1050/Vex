import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";
import { AuthModulePanel } from "@/components/auth/auth-module-panel";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
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
  const tLogin = await getTranslations("authShowcase.login");

  const showcaseCharts = {
    slide1Label: tLogin("charts.slide1Label"),
    slide1Value: tLogin("charts.slide1Value"),
    slide1Delta: tLogin("charts.slide1Delta"),
    slide1StageDraft: tLogin("charts.slide1StageDraft"),
    slide1StageSent: tLogin("charts.slide1StageSent"),
    slide1StageWon: tLogin("charts.slide1StageWon"),
    slide1Note: tLogin("charts.slide1Note"),
    slide2Label: tLogin("charts.slide2Label"),
    slide2Value: tLogin("charts.slide2Value"),
    slide2Delta: tLogin("charts.slide2Delta"),
    slide2AxisStart: tLogin("charts.slide2AxisStart"),
    slide2AxisEnd: tLogin("charts.slide2AxisEnd"),
    slide3Label: tLogin("charts.slide3Label"),
    slide3Value: tLogin("charts.slide3Value"),
    slide3Delta: tLogin("charts.slide3Delta"),
    slide3CategoryA: tLogin("charts.slide3CategoryA"),
    slide3CategoryB: tLogin("charts.slide3CategoryB"),
    slide3CategoryC: tLogin("charts.slide3CategoryC"),
    slide3CategoryD: tLogin("charts.slide3CategoryD"),
  };

  return (
    <section className="flex h-full w-full min-h-0 flex-1 flex-col">
      <div className="grid h-full min-h-0 flex-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-5 2xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] 2xl:gap-6">
        <AuthShowcasePanel
          brandName="VEX"
          brandSlogan={tLogin("brandSlogan")}
          heroDescription={tLogin("heroDescription")}
          charts={showcaseCharts}
        />

        <AuthModulePanel
          icon={<ShieldCheck className="size-4 text-primary" />}
          title={tAuth("login.title")}
          appTypeTitle={tLogin("appTypeTitle")}
          description={tLogin("description")}
          footerText={tAuth("login.noAccount")}
          footerActionLabel={tAuth("login.register")}
          footerHref={`/${locale}/register`}
        >
          <LoginForm
            locale={locale}
            redirectTo={query.redirectTo}
            initialError={query.error}
            showFooter={false}
          />
        </AuthModulePanel>
      </div>
    </section>
  );
}
