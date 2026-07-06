"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  loginAction,
  type LoginState,
} from "@/server/auth/actions/login.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {
  error: null,
  success: false,
  errorKey: null,
  status: undefined,
};

interface LoginFormProps {
  locale: string;
  redirectTo?: string;
}

export function LoginForm({ locale, redirectTo }: LoginFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

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
          autoComplete="current-password"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("login.loading") : t("login.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-primary hover:underline"
        >
          {t("login.register")}
        </Link>
      </p>
    </form>
  );
}
