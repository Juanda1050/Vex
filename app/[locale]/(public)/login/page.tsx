import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getOnboardingState } from "@/server/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
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
  const tLogin = await getTranslations("mvp.login");

  return (
    <Card className="mx-auto w-full max-w-xl border-primary/25 bg-linear-to-br from-card via-card to-primary/10">
      <CardHeader>
        <Badge variant="info" className="w-fit gap-1">
          <ShieldCheck className="size-3.5" />
          {tLogin("badge")}
        </Badge>
        <CardTitle>{tAuth("login.title")}</CardTitle>
        <CardDescription>{tLogin("description")}</CardDescription>
      </CardHeader>
      <div className="px-4 pb-4 sm:px-6">
        <LoginForm locale={locale} redirectTo={query.redirectTo} />
      </div>
      <CardFooter className="justify-between">
        <Link
          href={`/${locale}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {tLogin("back")}
        </Link>
        <span className="text-xs text-muted-foreground">
          {locale.toUpperCase()}
        </span>
      </CardFooter>
    </Card>
  );
}
