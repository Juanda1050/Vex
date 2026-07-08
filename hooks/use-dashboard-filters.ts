"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type DashboardPeriod,
  type DashboardSalesStatusFilter,
} from "@/lib/dashboard/dashboard-filters";

type UseDashboardFiltersProps = {
  period: DashboardPeriod;
  salesStatus: DashboardSalesStatusFilter;
};

type DashboardFilterHandlers = {
  isPending: boolean;
  period: DashboardPeriod;
  salesStatus: DashboardSalesStatusFilter;
  setPeriod: (value: DashboardPeriod | null, eventDetails?: unknown) => void;
  setSalesStatus: (
    value: DashboardSalesStatusFilter | null,
    eventDetails?: unknown,
  ) => void;
};

function useDashboardFilters({
  period,
  salesStatus,
}: UseDashboardFiltersProps): DashboardFilterHandlers {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedPeriod, setSelectedPeriod] =
    useOptimistic<DashboardPeriod>(period);
  const [selectedSalesStatus, setSelectedSalesStatus] =
    useOptimistic<DashboardSalesStatusFilter>(salesStatus);

  const updateFilter = (name: string, value: string, defaultValue: string) => {
    if (!pathname) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());

    if (value === defaultValue) {
      nextParams.delete(name);
    } else {
      nextParams.set(name, value);
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  return {
    isPending,
    period: selectedPeriod,
    salesStatus: selectedSalesStatus,
    setPeriod: (value: DashboardPeriod | null) => {
      if (value) {
        setSelectedPeriod(value);
        updateFilter("period", value, "7d");
      } else {
        setSelectedPeriod("7d");
        updateFilter("period", "7d", "7d");
      }
    },
    setSalesStatus: (value: DashboardSalesStatusFilter | null) => {
      if (value) {
        setSelectedSalesStatus(value);
        updateFilter("salesStatus", value, "all");
      } else {
        setSelectedSalesStatus("all");
        updateFilter("salesStatus", "all", "all");
      }
    },
  };
}

export { useDashboardFilters };
