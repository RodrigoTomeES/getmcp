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

export type SearchState = {
  q: string;
  categories: readonly string[];
  runtimes: readonly string[];
  transports: readonly string[];
  official: boolean;
  sort: SortOption;
  pageSize: number;
  page: number;
};

/**
 * True only for the unfiltered first page with the default sort and page size:
 * the state the statically rendered `initialServers` represent, so they can be
 * shown before the full `/servers.json` index arrives.
 */
export function isDefaultState(state: SearchState): boolean {
  return (
    state.q.trim() === "" &&
    state.categories.length === 0 &&
    state.runtimes.length === 0 &&
    state.transports.length === 0 &&
    !state.official &&
    state.sort === DEFAULT_SORT &&
    state.pageSize === DEFAULT_PAGE_SIZE &&
    state.page === 1
  );
}
