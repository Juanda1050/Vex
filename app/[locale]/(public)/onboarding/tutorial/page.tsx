import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { TutorialStepper } from "@/components/onboarding/tutorial-stepper";
import { getOnboardingState } from "@/server/auth";
import { authRepository } from "@/server/auth/repository/auth.repository";

export default async function OnboardingTutorialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated) {
    redirect(`/${locale}/login`);
  }

  if (!onboarding.needsOnboarding) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("mvp.onboarding.tutorial");

  async function completeOnboarding(): Promise<void> {
    "use server";
    const locale = await getLocale();
    const onboarding = await getOnboardingState();

    if (!onboarding.isAuthenticated || !onboarding.userId) {
      redirect(`/${locale}/login`);
    }

    await authRepository.markOnboardingCompleted(onboarding.userId);
    revalidatePath(`/${locale}/onboarding`);
    revalidatePath(`/${locale}/dashboard`);
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto grid w-full max-w-368 gap-6 lg:gap-8">
      <section className="space-y-2.5">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-sm leading-7 text-foreground/80 sm:text-base">
          {t("description")}
        </p>
      </section>

      <TutorialStepper onFinish={completeOnboarding} />
    </div>
  );
}
