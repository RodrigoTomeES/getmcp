"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ServerCard, type ServerCardData } from "./ServerCard";
import { Pill } from "./Pill";
import { useDebounce } from "@/hooks/use-debounce";

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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const initialized = useRef(false);

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const rt = params.get("runtime");
    const tp = params.get("transport");
    const sort = params.get("sort") as SortOption | null;

    if (q) setInputValue(q);
    if (cat && categories.includes(cat)) setSelectedCategory(cat);
    if (rt) setSelectedRuntime(rt);
    if (tp) setSelectedTransport(tp);
    if (sort === "stars" || sort === "downloads") setSortBy(sort);
    initialized.current = true;
    // categories is stable from server component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to URL
  useEffect(() => {
    if (!initialized.current) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedRuntime) params.set("runtime", selectedRuntime);
    if (selectedTransport) params.set("transport", selectedTransport);
    if (sortBy !== "relevance") params.set("sort", sortBy);

    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [query, selectedCategory, selectedRuntime, selectedTransport, sortBy]);

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

  const handleClearAll = () => {
    setInputValue("");
    setSelectedCategory(null);
    setSelectedRuntime(null);
    setSelectedTransport(null);
    setSortBy("relevance");
  };

  const hasActiveFilters = query || selectedCategory || selectedRuntime || selectedTransport;
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);
  const hasMoreCategories = categories.length > 8;

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
          onChange={(e) => setInputValue(e.target.value)}
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
        <Pill role="radio" active={!selectedCategory} onClick={() => setSelectedCategory(null)}>
          All
        </Pill>
        {visibleCategories.map((cat) => (
          <Pill
            key={cat}
            role="radio"
            active={selectedCategory === cat}
            onClick={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
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
            +{categories.length - 8} more
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
        <Pill role="radio" active={!selectedRuntime} onClick={() => setSelectedRuntime(null)}>
          All runtimes
        </Pill>
        {["node", "python", "docker", "binary"].map((rt) => (
          <Pill
            key={rt}
            role="radio"
            active={selectedRuntime === rt}
            onClick={() => setSelectedRuntime((prev) => (prev === rt ? null : rt))}
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
        <Pill role="radio" active={!selectedTransport} onClick={() => setSelectedTransport(null)}>
          All transports
        </Pill>
        <Pill
          role="radio"
          active={selectedTransport === "stdio"}
          onClick={() => setSelectedTransport((prev) => (prev === "stdio" ? null : "stdio"))}
        >
          stdio
        </Pill>
        <Pill
          role="radio"
          active={selectedTransport === "remote"}
          onClick={() => setSelectedTransport((prev) => (prev === "remote" ? null : "remote"))}
        >
          remote
        </Pill>
      </div>

      {/* Sort controls */}
      <p
        id="sort-label"
        className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2"
      >
        Sort by
      </p>
      <div className="flex flex-wrap gap-2 mb-6" role="radiogroup" aria-labelledby="sort-label">
        <Pill role="radio" active={sortBy === "relevance"} onClick={() => setSortBy("relevance")}>
          {query.trim() ? "Relevance" : "Default"}
        </Pill>
        <Pill role="radio" active={sortBy === "stars"} onClick={() => setSortBy("stars")}>
          Stars
        </Pill>
        <Pill role="radio" active={sortBy === "downloads"} onClick={() => setSortBy("downloads")}>
          Downloads
        </Pill>
      </div>

      <h2 className="sr-only">Server listing</h2>

      {/* Results count */}
      <p
        className="text-xs text-text-secondary mb-4 uppercase tracking-wider font-medium"
        role="status"
        aria-live="polite"
      >
        {filtered.length} server{filtered.length !== 1 ? "s" : ""}
        {query && ` matching "${query}"`}
        {selectedCategory && ` in ${selectedCategory}`}
        {selectedRuntime && ` (${selectedRuntime})`}
        {selectedTransport && ` (${selectedTransport})`}
      </p>

      {/* Server grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>

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
