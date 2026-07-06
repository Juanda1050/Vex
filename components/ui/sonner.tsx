"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-success)",
          "--success-text": "var(--color-success-foreground)",
          "--info-bg": "var(--color-info)",
          "--info-text": "var(--color-info-foreground)",
          "--warning-bg": "var(--color-warning)",
          "--warning-text": "var(--color-warning-foreground)",
          "--error-bg": "var(--color-destructive)",
          "--error-text": "var(--color-destructive-foreground)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast border border-border shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          success: "bg-success text-success-foreground border-success/20",
          info: "bg-info text-info-foreground border-info/20",
          warning: "bg-warning text-warning-foreground border-warning/20",
          error:
            "bg-destructive text-destructive-foreground border-destructive/20",
          actionButton: "bg-background text-foreground hover:bg-muted",
          cancelButton:
            "bg-secondary text-secondary-foreground hover:bg-secondary/85",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
