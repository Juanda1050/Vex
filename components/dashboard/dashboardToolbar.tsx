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
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import {
  type DashboardPeriod,
  type DashboardSalesStatusFilter,
} from "@/lib/dashboard/dashboardFilters";
import { type DashboardModuleKey } from "@/lib/dashboard/dashboardRoutes";
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
    setPeriod: setPeriodRaw,
    setSalesStatus: setSalesStatusRaw,
  } = useDashboardFilters({
    period,
    salesStatus,
  });

  const handlePeriodChange = (value: string | null) => {
    setPeriodRaw(value as DashboardPeriod | null);
  };

  const handleSalesStatusChange = (value: string | null) => {
    setSalesStatusRaw(value as DashboardSalesStatusFilter | null);
  };

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
                prefetch={false}
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
              value={selectedPeriod ?? "7d"}
              onValueChange={handlePeriodChange}
              disabled={isPending}
            >
              <SelectTrigger className="min-w-40 rounded-full bg-card/70">
                <SelectValue>
                  {(value: DashboardPeriod | null) =>
                    periodOptions.find((option) => option.value === value)
                      ?.label
                  }
                </SelectValue>
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
              value={selectedSalesStatus ?? "all"}
              onValueChange={handleSalesStatusChange}
              disabled={isPending}
            >
              <SelectTrigger className="min-w-44 rounded-full bg-card/70">
                <SelectValue>
                  {(value: DashboardSalesStatusFilter | null) =>
                    salesStatusOptions.find((option) => option.value === value)
                      ?.label
                  }
                </SelectValue>
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
      prefetch={false}
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
