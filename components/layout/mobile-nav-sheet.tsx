"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { TopNavigationEntry } from "@/components/layout/top-navigation";
import { getModuleIcon } from "@/lib/modules/module-icons";

type MobileNavSheetProps = {
  items: TopNavigationEntry[];
  navLabel: string;
  triggerLabel: string;
};

function isGroup(
  entry: TopNavigationEntry,
): entry is Extract<TopNavigationEntry, { items: unknown[] }> {
  return "items" in entry;
}

function MobileNavSheet({
  items,
  navLabel,
  triggerLabel,
}: MobileNavSheetProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0 border-sidebar-border bg-background/80 text-foreground shadow-sm backdrop-blur-sm lg:hidden"
            aria-label={triggerLabel}
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-4/5 p-0">
        <SheetHeader className="border-b border-border/70">
          <SheetTitle>{navLabel}</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {items.map((entry) => {
            if (isGroup(entry)) {
              return (
                <div key={entry.label} className="py-1.5">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </p>
                  {entry.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);
                    const ItemIcon = item.icon
                      ? getModuleIcon(item.icon)
                      : null;

                    return (
                      <SheetClose
                        key={item.href}
                        render={<Link href={item.href} prefetch={false} />}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                          isActive
                            ? "bg-primary/14 text-foreground"
                            : "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
                        )}
                      >
                        {ItemIcon ? <ItemIcon className="size-4" /> : null}
                        {item.label}
                      </SheetClose>
                    );
                  })}
                </div>
              );
            }

            const isActive =
              pathname === entry.href || pathname?.startsWith(`${entry.href}/`);
            const EntryIcon = entry.icon ? getModuleIcon(entry.icon) : null;

            return (
              <SheetClose
                key={entry.href}
                render={<Link href={entry.href} prefetch={false} />}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary/14 text-foreground"
                    : "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
                )}
              >
                {EntryIcon ? <EntryIcon className="size-4" /> : null}
                {entry.label}
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export { MobileNavSheet };
