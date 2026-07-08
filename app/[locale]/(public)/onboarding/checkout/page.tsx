import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EnhancedCheckoutForm } from "@/components/onboarding/enhanced-checkout-form";
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

  const t = await getTranslations("mvp.onboarding");

  async function handlePay(selectedPlanCode: string): Promise<void> {
    "use server";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await paymentGateway.createCheckoutSession({
      planCode: selectedPlanCode,
      userId: onboarding.userId ?? "",
      locale,
      successUrl: `${baseUrl}/${locale}/onboarding/welcome?plan=${selectedPlanCode}`,
      cancelUrl: `${baseUrl}/${locale}/onboarding`,
    });

    redirect(session.redirectUrl);
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 lg:gap-8">
      <section className="space-y-2.5">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {t("badge")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("checkout.title")}
        </h1>
        <p className="max-w-xl text-sm leading-7 text-foreground/80 sm:text-base">
          {t("checkout.description")}
        </p>
      </section>

      <EnhancedCheckoutForm
        planCode={planCode}
        locale={locale}
        onPay={handlePay}
      />
    </div>
  );
}
