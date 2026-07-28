"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import type { SortDirection } from "@/lib/modules/sort-params";
import { cn } from "@/lib/utils";

type SortableTableHeadProps = {
  sortKey: string;
  currentSort?: string;
  currentDir?: SortDirection;
  className?: string;
  align?: "left" | "right";
  children: React.ReactNode;
};

function SortableTableHead({
  sortKey,
  currentSort,
  currentDir,
  className,
  align = "left",
  children,
}: SortableTableHeadProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = currentSort === sortKey;
  const nextDir: SortDirection =
    isActive && currentDir === "asc" ? "desc" : "asc";

  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("sort", sortKey);
  nextParams.set("dir", nextDir);
  nextParams.delete("page");

  const Icon = isActive
    ? currentDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <Link
        href={`${pathname}?${nextParams.toString()}`}
        scroll={false}
        className={cn(
          "inline-flex items-center gap-1 transition hover:text-foreground",
          align === "right" && "flex-row-reverse",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        <Icon
          className={cn("size-3.5", isActive ? "opacity-100" : "opacity-40")}
        />
      </Link>
    </TableHead>
  );
}

export { SortableTableHead };
