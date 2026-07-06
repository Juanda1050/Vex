"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

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
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-1.5">
        <label
          htmlFor="orgName"
          className="text-sm font-medium text-foreground"
        >
          {t("register.orgName")}
        </label>
        <Input
          id="orgName"
          name="orgName"
          type="text"
          required
          minLength={3}
          placeholder={t("register.orgNamePlaceholder")}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t("login.email")}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("register.emailPlaceholder")}
        />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          {t("login.password")}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-foreground"
        >
          {t("register.confirmPassword")}
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
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

      <Button type="submit" disabled={pending} className="w-full">
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
