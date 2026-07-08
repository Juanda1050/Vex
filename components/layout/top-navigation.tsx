"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type TopNavigationItem = {
  href: string;
  label: string;
};

type TopNavigationProps = {
  items: TopNavigationItem[];
};

function TopNavigation({ items }: TopNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-primary/14 text-foreground"
                : "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export type { TopNavigationItem };
export { TopNavigation };
