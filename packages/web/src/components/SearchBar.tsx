"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ServerCard, type ServerCardData } from "./ServerCard";
import { Pagination } from "./Pagination";
import { FilterPanel } from "./FilterPanel";
import { FilterSheet } from "./FilterSheet";
import { Search, SlidersHorizontal } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZES = [24, 48, 72] as const;
const DEFAULT_PAGE_SIZE = 24;

type SortOption = "alphabetical" | "stars" | "downloads";

function parseMulti(param: string | null): string[] {
  return param ? param.split(",").filter(Boolean) : [];
}

export function SearchBar({
  servers,
  categories,
}: {
  servers: ServerCardData[];
  categories: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const query = useDebounce(inputValue, 300);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRuntimes, setSelectedRuntimes] = useState<string[]>([]);
  const [selectedTransports, setSelectedTransports] = useState<string[]>([]);
  const [officialOnly, setOfficialOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("stars");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const urlSyncReady = useRef(false);

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const rt = params.get("runtime");
    const tp = params.get("transport");
    const off = params.get("official");
    const sort = params.get("sort") as SortOption | null;
    const pp = params.get("per_page");
    const p = params.get("page");

    if (q) setInputValue(q);
    if (cat) setSelectedCategories(parseMulti(cat).filter((c) => categories.includes(c)));
    if (rt) setSelectedRuntimes(parseMulti(rt));
    if (tp) setSelectedTransports(parseMulti(tp));
    if (off === "true") setOfficialOnly(true);
    if (sort === "alphabetical" || sort === "downloads") setSortBy(sort);
    if (pp) {
      const parsed = Number(pp);
      if ((PAGE_SIZES as readonly number[]).includes(parsed)) setPageSize(parsed);
    }
    if (p) {
      const parsed = Number.parseInt(p, 10);
      if (parsed > 0 && Number.isFinite(parsed)) setPage(parsed);
    }
    // categories is stable from server component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to URL (skip first run to preserve URL-restored state)
  useEffect(() => {
    if (!urlSyncReady.current) {
      urlSyncReady.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategories.length) params.set("category", selectedCategories.join(","));
    if (selectedRuntimes.length) params.set("runtime", selectedRuntimes.join(","));
    if (selectedTransports.length) params.set("transport", selectedTransports.join(","));
    if (officialOnly) params.set("official", "true");
    if (sortBy !== "stars") params.set("sort", sortBy);
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set("per_page", String(pageSize));
    if (page > 1) params.set("page", String(page));

    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [
    query,
    selectedCategories,
    selectedRuntimes,
    selectedTransports,
    officialOnly,
    sortBy,
    pageSize,
    page,
  ]);

  // Pre-compute search strings (only rebuilds when servers change)
  const searchIndex = useMemo(
    () =>
      servers.map((s) => ({
        server: s,
        searchable: [s.id, s.slug, s.name, s.description, s.author ?? "", ...(s.categories ?? [])]
          .join(" ")
          .toLowerCase(),
      })),
    [servers],
  );

  const filtered = useMemo(() => {
    let result = searchIndex;

    if (selectedCategories.length > 0) {
      result = result.filter((item) =>
        selectedCategories.some((cat) => item.server.categories?.includes(cat)),
      );
    }

    if (selectedRuntimes.length > 0) {
      result = result.filter((item) => selectedRuntimes.includes(item.server.runtime ?? ""));
    }

    if (selectedTransports.length > 0) {
      result = result.filter((item) => {
        const transport = item.server.isRemote ? "remote" : "stdio";
        return selectedTransports.includes(transport);
      });
    }

    if (officialOnly) {
      result = result.filter((item) => item.server.isOfficial === true);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((item) => item.searchable.includes(q));
    }

    let sorted = result.map(({ server }) => server);

    if (sortBy === "stars") {
      sorted = [...sorted].sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));
    } else if (sortBy === "downloads") {
      sorted = [...sorted].sort((a, b) => (b.downloads ?? -1) - (a.downloads ?? -1));
    }

    return sorted;
  }, [
    searchIndex,
    query,
    selectedCategories,
    selectedRuntimes,
    selectedTransports,
    officialOnly,
    sortBy,
  ]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(page, Math.max(totalPages, 1));

  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClearAll = () => {
    setInputValue("");
    setSelectedCategories([]);
    setSelectedRuntimes([]);
    setSelectedTransports([]);
    setOfficialOnly(false);
    setSortBy("stars");
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);
  };

  // Reset page when filters change
  const handleCategoriesChange = (v: string[]) => {
    setSelectedCategories(v);
    setPage(1);
  };
  const handleRuntimesChange = (v: string[]) => {
    setSelectedRuntimes(v);
    setPage(1);
  };
  const handleTransportsChange = (v: string[]) => {
    setSelectedTransports(v);
    setPage(1);
  };
  const handleOfficialChange = (v: boolean) => {
    setOfficialOnly(v);
    setPage(1);
  };

  const hasActiveFilters =
    query.length > 0 ||
    selectedCategories.length > 0 ||
    selectedRuntimes.length > 0 ||
    selectedTransports.length > 0 ||
    officialOnly ||
    sortBy !== "stars" ||
    pageSize !== DEFAULT_PAGE_SIZE;

  const activeFilterCount =
    selectedCategories.length +
    selectedRuntimes.length +
    selectedTransports.length +
    (officialOnly ? 1 : 0);

  const startItem = filtered.length > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safePage * pageSize, filtered.length);

  const resultsSummary =
    totalPages > 1
      ? `Showing ${startItem}\u2013${endItem} of ${filtered.length} servers`
      : `${filtered.length} server${filtered.length !== 1 ? "s" : ""}`;

  const filterPanel = (
    <FilterPanel
      categories={categories}
      selectedCategories={selectedCategories}
      onCategoriesChange={handleCategoriesChange}
      selectedRuntimes={selectedRuntimes}
      onRuntimesChange={handleRuntimesChange}
      selectedTransports={selectedTransports}
      onTransportsChange={handleTransportsChange}
      officialOnly={officialOnly}
      onOfficialChange={handleOfficialChange}
    />
  );

  return (
    <div>
      {/* Search input - full width */}
      <div className="relative mb-4">
        <label htmlFor="server-search" className="sr-only">
          Search MCP servers
        </label>
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="server-search"
          type="search"
          placeholder="Search servers..."
          autoComplete="off"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Mobile: filter button + sort/per-page toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3 lg:hidden">
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          aria-expanded={isFilterOpen}
          aria-controls="filter-sheet"
          className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:border-text-secondary hover:text-text font-medium transition-colors inline-flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>

        {/* Sort */}
        <select
          aria-label="Sort by"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortOption);
            setPage(1);
          }}
          className="select-custom text-xs rounded-lg border border-border bg-surface text-text py-1.5 px-2 focus:outline-none focus:border-accent transition-colors appearance-none"
        >
          <option value="stars">Stars</option>
          <option value="downloads">Downloads</option>
          <option value="alphabetical">Alphabetical</option>
        </select>

        {/* Per page */}
        <select
          aria-label="Per page"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="select-custom text-xs rounded-lg border border-border bg-surface text-text py-1.5 px-2 focus:outline-none focus:border-accent transition-colors appearance-none"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      {/* Mobile filter sheet */}
      <FilterSheet
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onClearAll={handleClearAll}
        resultCount={filtered.length}
      >
        {filterPanel}
      </FilterSheet>

      {/* Two-column layout */}
      <div className="lg:flex lg:gap-8">
        {/* Sidebar - desktop only */}
        <aside className="hidden lg:block w-56 shrink-0">{filterPanel}</aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h2 className="sr-only">Server listing</h2>

          {/* Desktop toolbar: results count + sort + per page + clear */}
          <div className="hidden lg:flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            <p
              className="text-xs text-text-secondary uppercase tracking-wider font-medium"
              role="status"
              aria-live="polite"
            >
              {resultsSummary}
            </p>

            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-select"
                  className="text-xs text-text-secondary uppercase tracking-wider font-medium"
                >
                  Sort
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setPage(1);
                  }}
                  className="select-custom text-xs rounded-lg border border-border bg-surface text-text py-1.5 px-2 focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  <option value="stars">Stars</option>
                  <option value="downloads">Downloads</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              {/* Per page */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="per-page-select"
                  className="text-xs text-text-secondary uppercase tracking-wider font-medium"
                >
                  Per page
                </label>
                <select
                  id="per-page-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="select-custom text-xs rounded-lg border border-border bg-surface text-text py-1.5 px-2 focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs border border-border text-text-secondary hover:border-text-secondary hover:text-text px-3 py-1 rounded-md transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Mobile results count + clear */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 lg:hidden">
            <p
              className="text-xs text-text-secondary uppercase tracking-wider font-medium"
              role="status"
              aria-live="polite"
            >
              {resultsSummary}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs border border-border text-text-secondary hover:border-text-secondary hover:text-text px-3 py-1 rounded-md transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Server grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginated.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination page={safePage} totalPages={totalPages} onPageChange={handlePageChange} />

          {filtered.length === 0 && (
            <div role="alert" className="text-center py-24 text-text-secondary">
              <p className="text-lg mb-2">No servers found</p>
              <p className="text-sm mb-4">
                No results
                {query && (
                  <>
                    {" "}
                    for <strong className="text-text">&quot;{query}&quot;</strong>
                  </>
                )}
                {selectedCategories.length > 0 && (
                  <>
                    {" "}
                    in <strong className="text-text">{selectedCategories.join(", ")}</strong>
                  </>
                )}
                {selectedRuntimes.length > 0 && (
                  <>
                    {" "}
                    running on <strong className="text-text">{selectedRuntimes.join(", ")}</strong>
                  </>
                )}
                {selectedTransports.length > 0 && (
                  <>
                    {" "}
                    via <strong className="text-text">{selectedTransports.join(", ")}</strong>
                  </>
                )}
                {!hasActiveFilters && <>. Try adjusting your search or filters</>}.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm border border-border text-text-secondary hover:border-text-secondary hover:text-text px-4 py-2 rounded-md transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
