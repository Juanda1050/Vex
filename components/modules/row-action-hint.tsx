import { ChevronRight } from "lucide-react";

/**
 * Placeholder affordance shown on row hover — signals the row is
 * interactive ahead of real per-row actions (edit, etc) shipping.
 * Must sit inside a `relative` table cell within a `group` TableRow.
 */
function RowActionHint() {
  return (
    <ChevronRight
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-60"
    />
  );
}

export { RowActionHint };
