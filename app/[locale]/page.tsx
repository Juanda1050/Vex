import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";

export default async function LocaleEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const onboarding = await getOnboardingState();

  if (onboarding.isAuthenticated) {
    redirect(
      `/${locale}/${onboarding.needsOnboarding ? "onboarding" : "dashboard"}`,
    );
  }

  redirect(`/${locale}/login`);
}
