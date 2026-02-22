export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero skeleton */}
      <div className="text-center mb-10">
        <div className="h-10 w-72 mx-auto rounded bg-surface animate-pulse mb-3" />
        <div className="h-5 w-96 max-w-full mx-auto rounded bg-surface animate-pulse" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-11 w-full rounded-lg bg-surface animate-pulse mb-4" />

      {/* Category pills skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-surface animate-pulse" />
        ))}
      </div>

      {/* Server cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="h-6 w-32 rounded bg-surface-hover animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-surface-hover animate-pulse" />
            </div>
            <div className="h-4 w-full rounded bg-surface-hover animate-pulse mb-2" />
            <div className="h-4 w-2/3 rounded bg-surface-hover animate-pulse mb-3" />
            <div className="flex gap-2">
              <div className="h-5 w-12 rounded bg-surface-hover animate-pulse" />
              <div className="h-5 w-16 rounded bg-surface-hover animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
