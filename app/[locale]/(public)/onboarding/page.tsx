import { redirect } from "next/navigation";
import { Briefcase, CheckSquare, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getOnboardingState } from "@/server/auth";
import { subscriptionService } from "@/server/subscriptions";
import { OnboardingPlanSelector } from "@/components/subscriptions/onboarding-plan-selector";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const plans = await subscriptionService.listOfferedPlans();
  const currentSubscription = onboarding.tenantId
    ? await subscriptionService.getTenantSubscription(onboarding.tenantId)
    : null;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:gap-6">
      <Card className="border-primary/25 bg-linear-to-br from-card via-card to-primary/12">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3.5" />
              {t("badge")}
            </Badge>
            {onboarding.role ? (
              <Badge variant="outline">{onboarding.role}</Badge>
            ) : null}
          </div>
          <CardTitle className="text-2xl sm:text-3xl">{t("title")}</CardTitle>
          <CardDescription className="max-w-3xl text-sm sm:text-base">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("status.tenant")}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {onboarding.hasTenantMember
                  ? t("status.ok")
                  : t("status.pending")}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("status.branch")}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {onboarding.hasBranch ? t("status.ok") : t("status.pending")}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("status.warehouse")}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {onboarding.hasWarehouse ? t("status.ok") : t("status.pending")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="info" className="w-fit gap-1">
            <Briefcase className="size-3.5" />
            {t("plans.badge")}
          </Badge>
          <CardTitle>{t("plans.title")}</CardTitle>
          <CardDescription>{t("plans.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingPlanSelector
            plans={plans}
            currentPlanCode={currentSubscription?.plan.code}
            canManageBilling={onboarding.hasBillingAccess}
          />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <Badge variant="warning" className="w-fit gap-1">
            <CheckSquare className="size-3.5" />
            {t("nextSteps.badge")}
          </Badge>
          <CardTitle>{t("nextSteps.title")}</CardTitle>
          <CardDescription>{t("nextSteps.description")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
