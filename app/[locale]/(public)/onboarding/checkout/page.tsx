import { redirect } from "next/navigation";

import { EnhancedCheckoutForm } from "@/components/onboarding/enhancedCheckoutForm";
import { getOnboardingState } from "@/server/auth";
import { getPlanByCode } from "@/lib/payments/plans";
import { paymentGateway } from "@/lib/payments/gateway";

export default async function OnboardingCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const [{ locale }, { plan: planCode }] = await Promise.all([
    params,
    searchParams,
  ]);

  const onboarding = await getOnboardingState();

  if (!onboarding.isAuthenticated) {
    redirect(`/${locale}/login`);
  }

  if (!onboarding.needsOnboarding) {
    redirect(`/${locale}/dashboard`);
  }

  if (!planCode || !getPlanByCode(planCode)) {
    redirect(`/${locale}/onboarding`);
  }

  async function handlePay(
    selectedPlanCode: string,
    selectedPriceId?: string,
  ): Promise<void> {
    "use server";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await paymentGateway.createCheckoutSession({
      planCode: selectedPlanCode,
      priceId: selectedPriceId,
      userId: onboarding.userId ?? "",
      locale,
      successUrl: `${baseUrl}/${locale}/onboarding/welcome?plan=${selectedPlanCode}`,
      cancelUrl: `${baseUrl}/${locale}/onboarding`,
    });

    redirect(session.redirectUrl);
  }

  return (
    <div className="mx-auto grid w-full max-w-[116rem] gap-6 px-1.5 sm:px-3 lg:gap-8 xl:px-4">
      <EnhancedCheckoutForm
        planCode={planCode}
        locale={locale}
        onPay={handlePay}
      />
    </div>
  );
}
