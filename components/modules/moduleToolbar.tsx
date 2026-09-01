"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModuleToolbarStatusOption = {
  value: string;
  label: string;
};

type ModuleToolbarProps = {
  searchPlaceholder: string;
  searchParamName?: string;
  statusParamName?: string;
  statusLabel?: string;
  statusOptions?: ModuleToolbarStatusOption[];
};

function ModuleToolbar({
  searchPlaceholder,
  searchParamName = "search",
  statusParamName,
  statusLabel,
  statusOptions,
}: ModuleToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const tCommon = useTranslations("common");

  const urlSearchValue = searchParams.get(searchParamName) ?? "";
  const [syncedSearchValue, setSyncedSearchValue] = useState(urlSearchValue);
  const [searchValue, setSearchValue] = useState(urlSearchValue);

  if (urlSearchValue !== syncedSearchValue) {
    setSyncedSearchValue(urlSearchValue);
    setSearchValue(urlSearchValue);
  }

  const updateParam = useCallback(
    (name: string, value: string) => {
      if (!pathname) return;

      const nextParams = new URLSearchParams(searchParams.toString());

      if (value) {
        nextParams.set(name, value);
      } else {
        nextParams.delete(name);
      }
      nextParams.delete("page");

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const currentValue = searchParams.get(searchParamName) ?? "";
    if (searchValue === currentValue) return;

    const timeout = setTimeout(() => {
      updateParam(searchParamName, searchValue.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue, searchParamName, searchParams, updateParam]);

  const statusValue = statusParamName
    ? (searchParams.get(statusParamName) ?? "")
    : "";
  const activeStatusOption = statusValue
    ? statusOptions?.find((option) => option.value === statusValue)
    : undefined;

  const clearSearch = () => {
    setSearchValue("");
    updateParam(searchParamName, "");
  };

  const clearStatus = () => {
    if (statusParamName) {
      updateParam(statusParamName, "");
    }
  };

  const hasActiveFilters =
    Boolean(urlSearchValue) || Boolean(activeStatusOption);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>

        {statusParamName && statusOptions && statusOptions.length > 0 ? (
          <div className="space-y-1">
            {statusLabel ? (
              <p className="text-xs font-medium text-muted-foreground">
                {statusLabel}
              </p>
            ) : null}
            <Select
              value={statusValue || "__all__"}
              onValueChange={(value) =>
                updateParam(
                  statusParamName,
                  value === "__all__" ? "" : (value ?? ""),
                )
              }
            >
              <SelectTrigger className="min-w-44 rounded-full bg-card/70">
                <SelectValue>
                  {(value: string | null) =>
                    statusOptions.find(
                      (option) => (option.value || "__all__") === value,
                    )?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.value || "__all__"}
                    value={option.value || "__all__"}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {tCommon("activeFilters")}
          </span>
          {urlSearchValue ? (
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 py-1 pr-1.5 pl-3 text-xs font-medium text-foreground transition hover:border-border"
            >
              “{urlSearchValue}”
              <span className="flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <XIcon className="size-3" />
              </span>
            </button>
          ) : null}
          {activeStatusOption ? (
            <button
              type="button"
              onClick={clearStatus}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 py-1 pr-1.5 pl-3 text-xs font-medium text-foreground transition hover:border-border"
            >
              {activeStatusOption.label}
              <span className="flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <XIcon className="size-3" />
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { ModuleToolbarStatusOption };
export { ModuleToolbar };
