"use client";

import Link from "next/link";
import {
  Boxes,
  ChartColumnBig,
  FileText,
  Package,
  ShoppingBag,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import {
  type DashboardPeriod,
  type DashboardSalesStatusFilter,
} from "@/lib/dashboard/dashboard-filters";
import { type DashboardModuleKey } from "@/lib/dashboard/dashboard-routes";
import { cn } from "@/lib/utils";

type DashboardToolbarProps = {
  moduleItems?: Array<{
    key: DashboardModuleKey;
    label: string;
    href: string;
  }>;
  period: DashboardPeriod;
  salesStatus: DashboardSalesStatusFilter;
  rangeText: string;
  labels: {
    moduleNavigation?: string;
    period: string;
    salesStatus: string;
  };
  periodOptions: Array<{
    value: DashboardPeriod;
    label: string;
  }>;
  salesStatusOptions: Array<{
    value: DashboardSalesStatusFilter;
    label: string;
  }>;
};

const moduleIcons: Record<DashboardModuleKey, typeof ShoppingBag> = {
  sales: ShoppingBag,
  inventory: Boxes,
  products: Package,
  quotes: FileText,
};

function DashboardToolbar({
  moduleItems,
  period,
  salesStatus,
  rangeText,
  labels,
  periodOptions,
  salesStatusOptions,
}: DashboardToolbarProps) {
  const {
    isPending,
    period: selectedPeriod,
    salesStatus: selectedSalesStatus,
    setPeriod,
    setSalesStatus,
  } = useDashboardFilters({
    period,
    salesStatus,
  });

  return (
    <div className="space-y-4">
      {moduleItems && moduleItems.length > 0 && labels.moduleNavigation ? (
        <nav
          aria-label={labels.moduleNavigation}
          className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border/70 pb-3"
        >
          {moduleItems.map((item) => {
            const Icon = moduleIcons[item.key];

            return (
              <Link
                key={item.key}
                href={item.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Icon className="size-4 text-primary" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ChartColumnBig className="size-4 text-primary" />
          <span>{rangeText}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {labels.period}
            </p>
            <Select
              value={selectedPeriod}
              onValueChange={setPeriod}
              disabled={isPending}
            >
              <SelectTrigger className="min-w-40 rounded-full bg-card/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {labels.salesStatus}
            </p>
            <Select
              value={selectedSalesStatus}
              onValueChange={setSalesStatus}
              disabled={isPending}
            >
              <SelectTrigger className="min-w-44 rounded-full bg-card/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {salesStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCardLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "rounded-full border-border/80 bg-background/75",
      )}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden className="text-base leading-none text-primary">
        ↗
      </span>
    </Link>
  );
}

export { DashboardCardLink, DashboardToolbar };
