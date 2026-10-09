import type { ServerCardData } from "@/lib/server-detail";

/**
 * Sorting and paging options shared by the `/servers` SearchBar island.
 * Bundled into the client: keep imports type-only.
 */
export type SortOption = "alphabetical" | "stars" | "downloads";

export const DEFAULT_SORT: SortOption = "stars";

export const PAGE_SIZES = [24, 48, 72] as const;
export const DEFAULT_PAGE_SIZE = 24;

const nameCollator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/**
 * Returns a sorted copy of `list`. "alphabetical" sorts by display name
 * (case-insensitive, numeric-aware); "stars" and "downloads" sort descending
 * with missing values last. The sort is stable, so ties keep input order.
 */
export function sortServers(list: readonly ServerCardData[], sortBy: SortOption): ServerCardData[] {
  const sorted = [...list];
  if (sortBy === "alphabetical") {
    return sorted.sort((a, b) => nameCollator.compare(a.name, b.name));
  }
  return sorted.sort((a, b) => (b[sortBy] ?? -1) - (a[sortBy] ?? -1));
}
