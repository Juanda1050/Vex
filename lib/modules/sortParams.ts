type SortDirection = "asc" | "desc";

function resolveSortKey<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function resolveSortDirection(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

export { resolveSortDirection, resolveSortKey };
export type { SortDirection };
