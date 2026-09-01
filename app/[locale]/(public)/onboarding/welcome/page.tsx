import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { WelcomeScreen } from "@/components/onboarding/welcomeScreen";
import { getOnboardingState } from "@/server/auth";
import { invalidateAuthStateCache } from "@/server/auth/cache/authStateCache";
import { authRepository } from "@/server/auth/repository/auth.repository";
import { subscriptionService } from "@/server/subscriptions";
import { getPlanByCode } from "@/lib/payments/plans";
import { paymentGateway } from "@/lib/payments/gateway";

export default async function OnboardingWelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string; session?: string }>;
}) {
  const [{ locale }, { plan: planCode, session: sessionId }] =
    await Promise.all([params, searchParams]);

  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated) {
    redirect(`/${locale}/login`);
  }

  // Verify the payment session before showing the welcome screen.
  if (!planCode || !sessionId || !getPlanByCode(planCode)) {
    redirect(`/${locale}/onboarding`);
  }

  const verification = await paymentGateway.verifyPayment(sessionId);

  if (!verification.valid) {
    redirect(`/${locale}/onboarding`);
  }

  const verifiedPlanCode = verification.planCode;
  if (
    !verifiedPlanCode ||
    verifiedPlanCode.toLowerCase() !== planCode.toLowerCase()
  ) {
    redirect(`/${locale}/onboarding`);
  }

  if (!onboarding.tenantId) {
    redirect(`/${locale}/onboarding`);
  }

  try {
    await subscriptionService.changeTenantPlan({
      tenantId: onboarding.tenantId,
      planCode: verifiedPlanCode,
    });
  } catch {
    redirect(`/${locale}/onboarding`);
  }

  async function completeAndGoToDashboard(): Promise<void> {
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-2 py-4 sm:px-4">
      <WelcomeScreen
        planCode={planCode}
        locale={locale}
        onSkip={completeAndGoToDashboard}
      />
    </div>
  );
}
