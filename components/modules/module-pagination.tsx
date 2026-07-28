import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/server/pagination";

type ModulePaginationProps = {
  pagination: PaginationMeta;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  labels: {
    previous: string;
    next: string;
    of: string;
  };
};

function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || !value) continue;
    params.set(key, value);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function ModulePagination({
  pagination,
  basePath,
  searchParams,
  labels,
}: ModulePaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {pagination.page} {labels.of} {pagination.totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={buildPageHref(basePath, searchParams, pagination.page - 1)}
          aria-disabled={!pagination.hasPreviousPage}
          tabIndex={pagination.hasPreviousPage ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !pagination.hasPreviousPage &&
              "pointer-events-none opacity-50",
          )}
        >
          {labels.previous}
        </Link>
        <Link
          href={buildPageHref(basePath, searchParams, pagination.page + 1)}
          aria-disabled={!pagination.hasNextPage}
          tabIndex={pagination.hasNextPage ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !pagination.hasNextPage && "pointer-events-none opacity-50",
          )}
        >
          {labels.next}
        </Link>
      </div>
    </div>
  );
}

export { ModulePagination };
