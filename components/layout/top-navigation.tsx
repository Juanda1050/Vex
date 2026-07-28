"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getModuleIcon, type ModuleKey } from "@/lib/modules/module-icons";
import { cn } from "@/lib/utils";

type TopNavigationLink = {
  href: string;
  label: string;
  icon?: ModuleKey;
};

type TopNavigationGroup = {
  label: string;
  items: TopNavigationLink[];
};

type TopNavigationEntry = TopNavigationLink | TopNavigationGroup;

type TopNavigationProps = {
  items: TopNavigationEntry[];
};

function isGroup(entry: TopNavigationEntry): entry is TopNavigationGroup {
  return "items" in entry;
}

function isActiveHref(pathname: string | null, href: string) {
  return pathname === href || pathname?.startsWith(`${href}/`) === true;
}

function TopNavigation({ items }: TopNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
      {items.map((entry) => {
        if (isGroup(entry)) {
          const isGroupActive = entry.items.some((item) =>
            isActiveHref(pathname, item.href),
          );

          return (
            <DropdownMenu key={entry.label}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition",
                      isGroupActive
                        ? "bg-primary/14 text-foreground"
                        : "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
                    )}
                  />
                }
              >
                {entry.label}
                <ChevronDown className="size-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-48">
                {entry.items.map((item) => {
                  const ItemIcon = item.icon ? getModuleIcon(item.icon) : null;

                  return (
                    <DropdownMenuItem
                      key={item.href}
                      render={<Link href={item.href} prefetch={false} />}
                      data-active={
                        isActiveHref(pathname, item.href) || undefined
                      }
                      className="gap-2 data-[active]:bg-accent/60 data-[active]:text-foreground"
                    >
                      {ItemIcon ? (
                        <ItemIcon className="size-3.5 text-muted-foreground" />
                      ) : null}
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        const isActive = isActiveHref(pathname, entry.href);
        const EntryIcon = entry.icon ? getModuleIcon(entry.icon) : null;

        return (
          <Link
            key={entry.href}
            href={entry.href}
            prefetch={false}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-primary/14 text-foreground"
                : "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
            )}
          >
            {EntryIcon ? <EntryIcon className="size-3.5" /> : null}
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}

export type { TopNavigationEntry, TopNavigationGroup, TopNavigationLink };
export { TopNavigation };
