import { Inbox, SearchX } from "lucide-react";

type ModuleEmptyStateProps = {
  hasFilters: boolean;
  emptyText: string;
  noResultsText: string;
};

function ModuleEmptyState({
  hasFilters,
  emptyText,
  noResultsText,
}: ModuleEmptyStateProps) {
  const Icon = hasFilters ? SearchX : Inbox;

  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
      <Icon className="size-6 text-muted-foreground/70" />
      <p>{hasFilters ? noResultsText : emptyText}</p>
    </div>
  );
}

export { ModuleEmptyState };
