import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { completeOnboardingAndRedirectAction } from "@/app/actions/onboarding";
import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";
import { getOnboardingState } from "@/server/auth";
import { subscriptionService } from "@/server/subscriptions";
import { OnboardingPlanSelector } from "@/components/subscriptions/onboarding-plan-selector";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("mvp.onboarding");
  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated) {
    redirect(`/${locale}/login`);
  }

  if (!onboarding.needsOnboarding) {
    redirect(`/${locale}/dashboard`);
  }

  const [plans, currentSubscription] = await Promise.all([
    subscriptionService.listOfferedPlans(),
    onboarding.tenantId
      ? subscriptionService.getTenantSubscription(onboarding.tenantId)
      : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto grid w-full max-w-368 gap-6 lg:gap-8">
      <section className="space-y-2.5">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {t("headline")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-4xl text-sm leading-7 text-foreground/80 sm:text-base">
          {t("descriptionCompact")}
        </p>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {t("plans.title")}
            </h2>
            <form
              action={completeOnboardingAndRedirectAction}
              className="w-full sm:w-auto"
            >
              <LoadingSubmitButton
                type="submit"
                className="h-11 w-full sm:w-auto"
              >
                {t("continueToDashboard")}
              </LoadingSubmitButton>
            </form>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("plans.descriptionCompact")}
          </p>
        </div>
        <OnboardingPlanSelector
          locale={locale}
          plans={plans}
          currentPlanCode={currentSubscription?.plan.code}
          canManageBilling={onboarding.hasBillingAccess}
        />
      </section>
    </div>
  );
}
