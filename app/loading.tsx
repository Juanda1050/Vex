import { LoadingSpinner } from "@/components/ui/loadingSpinner";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="inline-flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm text-muted-foreground">
        <LoadingSpinner />
      </div>
    </div>
  );
}
