import type { ServerCardData } from "@/lib/server-detail";

/**
 * Sorting, paging and URL state helpers shared by the `/servers` SearchBar island.
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

export const SORT_OPTIONS: readonly SortOption[] = ["stars", "downloads", "alphabetical"];
export const RUNTIMES = ["node", "python", "docker", "binary"] as const;
export const TRANSPORTS = ["stdio", "remote"] as const;

/** Query params owned by the search state; any other param is left untouched. */
export const URL_STATE_PARAMS = [
  "q",
  "category",
  "runtime",
  "transport",
  "official",
  "sort",
  "per_page",
  "page",
] as const;

/** Splits a comma list, keeping only allowed values, without duplicates. */
function readMulti(value: string | null, allowed: readonly string[]): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").filter((v) => allowed.includes(v)))];
}

/**
 * Parses `/servers` search state from a query string. Unknown or invalid
 * values fall back to the defaults: categories, runtimes and transports are
 * whitelisted and deduped, `sort` and `per_page` must be known options and
 * `page` must be a positive integer (it is clamped to the result count later).
 */
export function readSearchState(search: string, validCategories: readonly string[]): SearchState {
  const params = new URLSearchParams(search);
  const sort = params.get("sort");
  const pageSize = Number(params.get("per_page"));
  const page = params.get("page") ?? "";
  return {
    q: params.get("q") ?? "",
    categories: readMulti(params.get("category"), validCategories),
    runtimes: readMulti(params.get("runtime"), RUNTIMES),
    transports: readMulti(params.get("transport"), TRANSPORTS),
    official: params.get("official") === "true",
    sort: SORT_OPTIONS.find((s) => s === sort) ?? DEFAULT_SORT,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
    page: /^[1-9]\d*$/.test(page) ? Number(page) : 1,
  };
}

/**
 * Builds the canonical query string (without "?") for `state`: defaults and
 * page 1 are omitted, and params of `current` outside the search state (such
 * as `utm_*`) are kept after the state params.
 */
export function toSearchString(state: SearchState, current = ""): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.categories.length) params.set("category", state.categories.join(","));
  if (state.runtimes.length) params.set("runtime", state.runtimes.join(","));
  if (state.transports.length) params.set("transport", state.transports.join(","));
  if (state.official) params.set("official", "true");
  if (state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set("per_page", String(state.pageSize));
  if (state.page > 1) params.set("page", String(state.page));
  const known: readonly string[] = URL_STATE_PARAMS;
  for (const [key, value] of new URLSearchParams(current)) {
    if (!known.includes(key)) params.append(key, value);
  }
  // Commas are valid in a query string; keep the lists readable.
  return params.toString().replace(/%2C/gi, ",");
}
