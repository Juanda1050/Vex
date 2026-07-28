"use client";

import { CheckIcon, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

type InlineSaveStatusProps = {
  pending: boolean;
  success: boolean;
};

function InlineSaveStatus({ pending, success }: InlineSaveStatusProps) {
  const t = useTranslations("settings");

  if (!pending && !success) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {pending ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin" />
          {t("messages.saving")}
        </>
      ) : (
        <>
          <CheckIcon className="size-3.5 text-success" />
          {t("messages.saved")}
        </>
      )}
    </span>
  );
}

export { InlineSaveStatus };
