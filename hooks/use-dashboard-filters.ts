"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type DashboardPeriod,
  type DashboardSalesStatusFilter,
} from "@/lib/dashboard/dashboard-filters";

type UseDashboardFiltersProps = {
  period: DashboardPeriod;
  salesStatus: DashboardSalesStatusFilter;
};

function useDashboardFilters({
  period,
  salesStatus,
}: UseDashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(period);
  const [selectedSalesStatus, setSelectedSalesStatus] =
    useState<DashboardSalesStatusFilter>(salesStatus);

  useEffect(() => {
    setSelectedPeriod(period);
  }, [period]);

  useEffect(() => {
    setSelectedSalesStatus(salesStatus);
  }, [salesStatus]);

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
    setPeriod: (value: string) => {
      setSelectedPeriod(value as DashboardPeriod);
      updateFilter("period", value, "7d");
    },
    setSalesStatus: (value: string) => {
      setSelectedSalesStatus(value as DashboardSalesStatusFilter);
      updateFilter("salesStatus", value, "all");
    },
  };
}

export { useDashboardFilters };
