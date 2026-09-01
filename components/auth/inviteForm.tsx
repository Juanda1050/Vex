"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Mail, LockKeyhole, UserCircle2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import {
  acceptInvitationAction,
  type ActionResult,
} from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialResult: ActionResult = {
  success: false,
  error: null,
  errorKey: null,
  status: undefined,
  inviteUrl: null,
  mailtoUrl: null,
  whatsappUrl: null,
};

function AvatarPreview({ avatarUrl }: { avatarUrl: string | null }) {
  if (!avatarUrl) {
    return (
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 text-muted-foreground">
        <WandSparkles className="size-4" />
      </div>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt="Avatar preview"
      width={64}
      height={64}
      unoptimized
      className="size-16 rounded-2xl border border-border object-cover"
    />
  );
}

export function InviteForm({ email, token }: { email: string; token: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(
    acceptInvitationAction,
    initialResult,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(t("invite.success"));
    }

    if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("invite.avatarTooLarge"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setAvatarDataUrl(result);
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <Badge variant="info" className="w-fit">
          {t("invite.badge")}
        </Badge>
        <CardTitle>{t("invite.title")}</CardTitle>
        <CardDescription>{t("invite.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="token" value={token} />
          <input
            type="hidden"
            name="avatarDataUrl"
            value={avatarDataUrl ?? ""}
          />

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="invite-email">{t("invite.email")}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                name="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-full-name">{t("invite.fullName")}</Label>
            <div className="relative">
              <UserCircle2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder={t("invite.fullNamePlaceholder")}
                className="pl-9"
                disabled={pending}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-avatar">{t("invite.avatar")}</Label>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
              <AvatarPreview avatarUrl={avatarPreview} />
              <Input
                id="invite-avatar"
                name="avatarFile"
                type="file"
                accept="image/*"
                disabled={pending}
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("invite.avatarLimit")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-password">{t("invite.password")}</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="pl-9"
                disabled={pending}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-confirm-password">
              {t("invite.confirmPassword")}
            </Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="pl-9"
                disabled={pending}
                required
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto"
            >
              {t("invite.submit")}
            </Button>
          </div>
        </form>

        {state.success ? (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {t("invite.success")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
