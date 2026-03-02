"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ServerCard, type ServerCardData } from "./ServerCard";
import { Pill } from "./Pill";
import { Pagination } from "./Pagination";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZES = [24, 48, 72] as const;
const DEFAULT_PAGE_SIZE = 24;
const VISIBLE_CATEGORIES = 8;

type SortOption = "relevance" | "stars" | "downloads";

export function SearchBar({
  servers,
  categories,
}: {
  servers: ServerCardData[];
  categories: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const query = useDebounce(inputValue, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRuntime, setSelectedRuntime] = useState<string | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [page, setPage] = useState(1);
  const urlSyncReady = useRef(false);

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const rt = params.get("runtime");
    const tp = params.get("transport");
    const sort = params.get("sort") as SortOption | null;
    const pp = params.get("per_page");
    const p = params.get("page");

    if (q) setInputValue(q);
    if (cat && categories.includes(cat)) setSelectedCategory(cat);
    if (rt) setSelectedRuntime(rt);
    if (tp) setSelectedTransport(tp);
    if (sort === "stars" || sort === "downloads") setSortBy(sort);
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
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedRuntime) params.set("runtime", selectedRuntime);
    if (selectedTransport) params.set("transport", selectedTransport);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set("per_page", String(pageSize));
    if (page > 1) params.set("page", String(page));

    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [query, selectedCategory, selectedRuntime, selectedTransport, sortBy, pageSize, page]);

  // Pre-compute search strings (only rebuilds when servers change)
  const searchIndex = useMemo(
    () =>
      servers.map((s) => ({
        server: s,
        searchable: [s.id, s.name, s.description, s.author ?? "", ...(s.categories ?? [])]
          .join(" ")
          .toLowerCase(),
      })),
    [servers],
  );

  const filtered = useMemo(() => {
    let result = searchIndex;

    if (selectedCategory) {
      result = result.filter((item) => item.server.categories?.includes(selectedCategory));
    }

    if (selectedRuntime) {
      result = result.filter((item) => item.server.runtime === selectedRuntime);
    }

    if (selectedTransport) {
      if (selectedTransport === "remote") {
        result = result.filter((item) => item.server.isRemote);
      } else {
        result = result.filter((item) => !item.server.isRemote);
      }
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
  }, [searchIndex, query, selectedCategory, selectedRuntime, selectedTransport, sortBy]);

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
    setSelectedCategory(null);
    setSelectedRuntime(null);
    setSelectedTransport(null);
    setSortBy("relevance");
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);
  };

  const hasActiveFilters =
    query ||
    selectedCategory ||
    selectedRuntime ||
    selectedTransport ||
    sortBy !== "relevance" ||
    pageSize !== DEFAULT_PAGE_SIZE;
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, VISIBLE_CATEGORIES);
  const hasMoreCategories = categories.length > VISIBLE_CATEGORIES;

  const startItem = filtered.length > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safePage * pageSize, filtered.length);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <label htmlFor="server-search" className="sr-only">
          Search MCP servers
        </label>
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
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

      {/* Category filters */}
      <p
        id="category-filter-label"
        className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2"
      >
        Category
      </p>
      <div
        className="flex flex-wrap gap-2 mb-4"
        role="radiogroup"
        aria-labelledby="category-filter-label"
      >
        <Pill
          role="radio"
          active={!selectedCategory}
          onClick={() => {
            setSelectedCategory(null);
            setPage(1);
          }}
        >
          All
        </Pill>
        {visibleCategories.map((cat) => (
          <Pill
            key={cat}
            role="radio"
            active={selectedCategory === cat}
            onClick={() => {
              setSelectedCategory((prev) => (prev === cat ? null : cat));
              setPage(1);
            }}
          >
            {cat}
          </Pill>
        ))}
        {hasMoreCategories && !showAllCategories && (
          <button
            type="button"
            onClick={() => setShowAllCategories(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:text-text transition-colors"
          >
            +{categories.length - VISIBLE_CATEGORIES} more
          </button>
        )}
      </div>

      {/* Runtime filters */}
      <p
        id="runtime-filter-label"
        className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2"
      >
        Runtime
      </p>
      <div
        className="flex flex-wrap gap-2 mb-4"
        role="radiogroup"
        aria-labelledby="runtime-filter-label"
      >
        <Pill
          role="radio"
          active={!selectedRuntime}
          onClick={() => {
            setSelectedRuntime(null);
            setPage(1);
          }}
        >
          All runtimes
        </Pill>
        {["node", "python", "docker", "binary"].map((rt) => (
          <Pill
            key={rt}
            role="radio"
            active={selectedRuntime === rt}
            onClick={() => {
              setSelectedRuntime((prev) => (prev === rt ? null : rt));
              setPage(1);
            }}
          >
            {rt}
          </Pill>
        ))}
      </div>

      {/* Transport filters */}
      <p
        id="transport-filter-label"
        className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2"
      >
        Transport
      </p>
      <div
        className="flex flex-wrap gap-2 mb-6"
        role="radiogroup"
        aria-labelledby="transport-filter-label"
      >
        <Pill
          role="radio"
          active={!selectedTransport}
          onClick={() => {
            setSelectedTransport(null);
            setPage(1);
          }}
        >
          All transports
        </Pill>
        <Pill
          role="radio"
          active={selectedTransport === "stdio"}
          onClick={() => {
            setSelectedTransport((prev) => (prev === "stdio" ? null : "stdio"));
            setPage(1);
          }}
        >
          stdio
        </Pill>
        <Pill
          role="radio"
          active={selectedTransport === "remote"}
          onClick={() => {
            setSelectedTransport((prev) => (prev === "remote" ? null : "remote"));
            setPage(1);
          }}
        >
          remote
        </Pill>
      </div>

      {/* Sort & per page controls */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mb-6">
        <div>
          <p
            id="sort-label"
            className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2"
          >
            Sort by
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="sort-label">
            <Pill
              role="radio"
              active={sortBy === "relevance"}
              onClick={() => {
                setSortBy("relevance");
                setPage(1);
              }}
            >
              {query.trim() ? "Relevance" : "Default"}
            </Pill>
            <Pill
              role="radio"
              active={sortBy === "stars"}
              onClick={() => {
                setSortBy("stars");
                setPage(1);
              }}
            >
              Stars
            </Pill>
            <Pill
              role="radio"
              active={sortBy === "downloads"}
              onClick={() => {
                setSortBy("downloads");
                setPage(1);
              }}
            >
              Downloads
            </Pill>
          </div>
        </div>

        <div>
          <p
            id="per-page-label"
            className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2"
          >
            Per page
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="per-page-label">
            {PAGE_SIZES.map((size) => (
              <Pill
                key={size}
                role="radio"
                active={pageSize === size}
                onClick={() => {
                  setPageSize(size);
                  setPage(1);
                }}
              >
                {size}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <h2 className="sr-only">Server listing</h2>

      {/* Results count + clear filters */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
        <p
          className="text-xs text-text-secondary uppercase tracking-wider font-medium"
          role="status"
          aria-live="polite"
        >
          {totalPages > 1
            ? `Showing ${startItem}–${endItem} of ${filtered.length} servers`
            : `${filtered.length} server${filtered.length !== 1 ? "s" : ""}`}
          {query && ` matching "${query}"`}
          {selectedCategory && ` in ${selectedCategory}`}
          {selectedRuntime && ` (${selectedRuntime})`}
          {selectedTransport && ` (${selectedTransport})`}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs border border-border text-text-secondary hover:border-text-secondary hover:text-text px-3 py-1 rounded-md transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Server grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {selectedCategory && (
              <>
                {" "}
                in <strong className="text-text">{selectedCategory}</strong>
              </>
            )}
            {selectedRuntime && (
              <>
                {" "}
                running on <strong className="text-text">{selectedRuntime}</strong>
              </>
            )}
            {selectedTransport && (
              <>
                {" "}
                via <strong className="text-text">{selectedTransport}</strong>
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
  );
}
