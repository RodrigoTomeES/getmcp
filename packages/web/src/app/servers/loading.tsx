export default function ServersLoading() {
  return (
    <div
      className="max-w-6xl mx-auto px-6 py-10 md:py-16 animate-pulse"
      aria-busy="true"
      aria-label="Loading server directory"
      role="status"
    >
      <span className="sr-only">Loading MCP server directory, please wait...</span>

      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-surface-hover rounded mb-8" />

      {/* Header skeleton */}
      <div className="mb-12">
        <div className="h-9 w-64 bg-surface-hover rounded mb-3" />
        <div className="h-5 w-96 bg-surface-hover rounded" />
      </div>

      {/* Search input skeleton */}
      <div className="h-10 w-full bg-surface-hover rounded-lg mb-4" />

      {/* Category label + pills skeleton */}
      <div className="h-3 w-16 bg-surface-hover rounded mb-2" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-surface-hover rounded-full" />
        ))}
      </div>

      {/* Runtime label + pills skeleton */}
      <div className="h-3 w-16 bg-surface-hover rounded mb-2" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-surface-hover rounded-full" />
        ))}
      </div>

      {/* Transport label + pills skeleton */}
      <div className="h-3 w-20 bg-surface-hover rounded mb-2" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-24 bg-surface-hover rounded-full" />
        ))}
      </div>

      {/* Sort label + pills skeleton */}
      <div className="h-3 w-12 bg-surface-hover rounded mb-2" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-24 bg-surface-hover rounded-full" />
        ))}
      </div>

      {/* Results count skeleton */}
      <div className="h-3 w-24 bg-surface-hover rounded mb-4" />

      {/* Server grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-40 bg-surface-hover rounded-lg border border-border" />
        ))}
      </div>
    </div>
  );
}
