"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, LockKeyhole, Mail } from "lucide-react";

import {
  registerAction,
  type RegisterState,
} from "@/server/auth/actions/register.action";
import { loginWithGoogleAction } from "@/server/auth/actions/login-google.action";
import { Input } from "@/components/ui/input";
import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";

const initialState: RegisterState = {
  error: null,
  success: false,
  errorKey: null,
  status: undefined,
};

interface RegisterFormProps {
  locale: string;
  showFooter?: boolean;
}

export function RegisterForm({ locale, showFooter = true }: RegisterFormProps) {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState(registerAction, initialState);
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSubmit = useMemo(
    () =>
      orgName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0,
    [orgName, email, password, confirmPassword],
  );

  return (
    <form action={formAction} className="grid gap-3 sm:gap-4 xl:gap-4.5">
      <div className="grid gap-3 md:gap-4">
        <div className="grid gap-1.5">
          <label
            htmlFor="orgName"
            className="text-xs font-medium text-foreground sm:text-sm xl:text-[0.95rem]"
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
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
              disabled={!canSubmit}
              className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11 xl:h-12 xl:text-[0.98rem]"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="email"
            className="text-xs font-medium text-foreground sm:text-sm xl:text-[0.95rem]"
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!canSubmit}
              className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11 xl:h-12 xl:text-[0.98rem]"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-medium text-foreground sm:text-sm xl:text-[0.95rem]"
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
              placeholder={t("register.passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!canSubmit}
              className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11 xl:h-12 xl:text-[0.98rem]"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-medium text-foreground sm:text-sm xl:text-[0.95rem]"
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
              placeholder={t("register.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={!canSubmit}
              className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 text-sm sm:h-11 xl:h-12 xl:text-[0.98rem]"
            />
          </div>
        </div>
      </div>

      {state.success ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {t("register.successMessage")}
        </p>
      ) : null}

      <LoadingSubmitButton
        type="submit"
        disabled={!canSubmit}
        pendingText={t("register.loading")}
        className="h-10 w-full rounded-2xl text-sm sm:h-11 sm:text-[0.95rem] xl:h-12 xl:text-[1rem]"
      >
        {t("register.submit")}
      </LoadingSubmitButton>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 py-0.5 text-xs text-muted-foreground dark:text-foreground/72">
        <span className="h-px flex-1 bg-border/80" />
        <span>{t("login.continueWith")}</span>
        <span className="h-px flex-1 bg-border/80" />
      </div>

      <LoadingSubmitButton
        type="submit"
        formAction={loginWithGoogleAction}
        formNoValidate
        pendingText={t("login.loading")}
        variant="outline"
        className="h-10 w-full rounded-2xl border-border/65 bg-background/60 text-sm backdrop-blur-sm sm:h-11 xl:h-12 xl:text-[0.98rem]"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-4">
          <path
            d="M21.35 12.23c0-.72-.06-1.25-.2-1.81H12v3.45h5.37c-.1.86-.65 2.16-1.88 3.03l-.02.12 2.74 2.08.19.02c1.74-1.56 2.95-3.84 2.95-6.89Z"
            fill="#4285F4"
          />
          <path
            d="M12 21.5c2.63 0 4.84-.85 6.45-2.3l-3.08-2.36c-.82.56-1.92.96-3.37.96-2.57 0-4.74-1.65-5.51-3.94l-.12.01-2.85 2.16-.04.11C5.08 19.3 8.29 21.5 12 21.5Z"
            fill="#34A853"
          />
          <path
            d="M6.49 13.86a5.78 5.78 0 0 1-.32-1.86c0-.65.12-1.28.31-1.86l-.01-.13-2.89-2.2-.09.04A9.34 9.34 0 0 0 2.5 12c0 1.49.36 2.9.99 4.14l3-2.28Z"
            fill="#FBBC05"
          />
          <path
            d="M12 6.2c1.83 0 3.06.77 3.76 1.41l2.74-2.62C16.83 3.5 14.63 2.5 12 2.5 8.29 2.5 5.08 4.7 3.49 7.86l2.99 2.29C7.26 7.85 9.43 6.2 12 6.2Z"
            fill="#EA4335"
          />
        </svg>
        {t("login.google")}
      </LoadingSubmitButton>

      {showFooter ? (
        <p className="text-center text-sm text-muted-foreground dark:text-foreground/72">
          {t("register.hasAccount")}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-primary hover:underline"
          >
            {t("register.login")}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
