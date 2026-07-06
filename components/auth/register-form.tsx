"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Building2, LockKeyhole, Mail } from "lucide-react";

import {
  registerAction,
  type RegisterState,
} from "@/server/auth/actions/register.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterState = {
  error: null,
  success: false,
  errorKey: null,
  status: undefined,
};

interface RegisterFormProps {
  locale: string;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:gap-4">
      <div className="grid gap-1.5">
        <label
          htmlFor="orgName"
          className="text-xs font-medium text-foreground sm:text-sm"
        >
          {t("register.orgName")}
        </label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-foreground/60 sm:size-4" />
          <Input
            id="orgName"
            name="orgName"
            type="text"
            required
            minLength={3}
            placeholder={t("register.orgNamePlaceholder")}
            className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium text-foreground sm:text-sm"
        >
          {t("login.email")}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-foreground/60 sm:size-4" />
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("register.emailPlaceholder")}
            className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-medium text-foreground sm:text-sm"
        >
          {t("login.password")}
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-foreground/60 sm:size-4" />
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-xs font-medium text-foreground sm:text-sm"
        >
          {t("register.confirmPassword")}
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-foreground/60 sm:size-4" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11"
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {t("register.successMessage")}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-2xl text-sm sm:h-11 sm:text-[0.95rem]"
      >
        {pending ? t("register.loading") : t("register.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("register.hasAccount")}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-primary hover:underline"
        >
          {t("register.login")}
        </Link>
      </p>
    </form>
  );
}
