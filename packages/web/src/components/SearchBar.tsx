"use client";

import { useState, useMemo } from "react";
import type { RegistryEntryType } from "@getmcp/core";
import { ServerCard } from "./ServerCard";

export function SearchBar({
  servers,
  categories,
}: {
  servers: RegistryEntryType[];
  categories: RegistryEntryType["categories"];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    RegistryEntryType["categories"][number] | null
  >(null);

  const filtered = useMemo(() => {
    let result = servers;

    if (selectedCategory) {
      result = result.filter((s) => s.categories?.includes(selectedCategory));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((s) => {
        const searchable = [s.id, s.name, s.description, ...(s.categories ?? []), s.author ?? ""]
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      });
    }

    return result;
  }, [servers, query, selectedCategory]);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]"
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
          type="text"
          placeholder="Search servers..."
          aria-label="Search servers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by category">
        <button
          onClick={() => setSelectedCategory(null)}
          aria-pressed={!selectedCategory}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !selectedCategory
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            aria-pressed={selectedCategory === cat}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selectedCategory === cat
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p
        className="text-sm text-[var(--color-text-secondary)] mb-4"
        role="status"
        aria-live="polite"
      >
        {filtered.length} server{filtered.length !== 1 ? "s" : ""}
        {query && ` matching "${query}"`}
        {selectedCategory && ` in ${selectedCategory}`}
      </p>

      {/* Server grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          <p className="text-lg mb-2">No servers found</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
