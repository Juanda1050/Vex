import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const tRegister = await getTranslations("mvp.register");

  return (
    <Card className="mx-auto w-full max-w-xl border-primary/25 bg-linear-to-br from-card via-card to-primary/10">
      <CardHeader>
        <Badge variant="info" className="w-fit gap-1">
          <UserPlus className="size-3.5" />
          {tRegister("badge")}
        </Badge>
        <CardTitle>{tAuth("register.title")}</CardTitle>
        <CardDescription>{tRegister("description")}</CardDescription>
      </CardHeader>
      <div className="px-4 pb-4 sm:px-6">
        <RegisterForm locale={locale} />
      </div>
      <CardFooter className="justify-between">
        <Link
          href={`/${locale}/login`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {tRegister("backToLogin")}
        </Link>
        <span className="text-xs text-muted-foreground">
          {locale.toUpperCase()}
        </span>
      </CardFooter>
    </Card>
  );
}
