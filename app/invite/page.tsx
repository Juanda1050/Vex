import { getTranslations } from "next-intl/server";

import { InviteForm } from "@/components/auth/inviteForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const t = await getTranslations("auth");
  const { email, token } = await searchParams;

  if (!email || !token) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("invite.invalidTitle")}</CardTitle>
            <CardDescription>{t("invite.invalidDescription")}</CardDescription>
          </CardHeader>
          <CardContent>{t("invite.invalidBody")}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            Vex
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("invite.heading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("invite.subheading")}
          </p>
        </div>
        <InviteForm email={email} token={token} />
      </div>
    </div>
  );
}
