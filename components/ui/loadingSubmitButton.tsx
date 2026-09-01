"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";

type LoadingSubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function LoadingSubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: LoadingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={disabled || pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <LoadingSpinner className="size-4" />
          <span>{pendingText ?? children}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
