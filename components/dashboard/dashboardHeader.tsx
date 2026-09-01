import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type DashboardHeaderProps = {
  title: ReactNode;
  description: ReactNode;
  badge: ReactNode;
  icon: LucideIcon;
};

function DashboardHeader({
  title,
  description,
  badge,
  icon: Icon,
}: DashboardHeaderProps) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-display text-foreground">{title}</h1>
          <Badge
            variant="success"
            className="gap-1.5 border-0 bg-success/12 text-success shadow-none"
          >
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            {badge}
          </Badge>
        </div>
        <p className="text-body max-w-3xl leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export { DashboardHeader };
