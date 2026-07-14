import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { TutorialStepper } from "@/components/onboarding/tutorial-stepper";
import { getOnboardingState } from "@/server/auth";
import { invalidateAuthStateCache } from "@/server/auth/cache/auth-state-cache";
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

  const t = await getTranslations("onboarding.tutorial");

  async function completeOnboarding(): Promise<void> {
    "use server";
    const locale = await getLocale();
    const onboarding = await getOnboardingState();

    if (!onboarding.isAuthenticated || !onboarding.userId) {
      redirect(`/${locale}/login`);
    }

    await authRepository.markOnboardingCompleted(onboarding.userId);
    invalidateAuthStateCache(onboarding.userId);
    revalidatePath(`/${locale}/onboarding`);
    revalidatePath(`/${locale}/dashboard`);
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 py-4 lg:gap-8">
      <section className="mx-auto w-full max-w-3xl space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-foreground/80 sm:text-base">
          {t("description")}
        </p>
      </section>

      <div className="mx-auto w-full max-w-5xl">
        <TutorialStepper onFinish={completeOnboarding} />
      </div>
    </div>
  );
}
