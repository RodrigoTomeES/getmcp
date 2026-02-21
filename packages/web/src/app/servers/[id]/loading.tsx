export default function ServerLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-40 rounded bg-[var(--color-surface)] animate-pulse mb-6" />

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-9 w-56 rounded bg-[var(--color-surface)] animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-[var(--color-surface)] animate-pulse mt-2" />
        </div>
        <div className="h-5 w-full rounded bg-[var(--color-surface)] animate-pulse mb-2" />
        <div className="h-5 w-2/3 rounded bg-[var(--color-surface)] animate-pulse" />
      </div>

      {/* Metadata grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <div className="h-3 w-16 rounded bg-[var(--color-surface-hover)] animate-pulse mb-2" />
            <div className="h-4 w-32 rounded bg-[var(--color-surface-hover)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Categories skeleton */}
      <div className="mb-8">
        <div className="h-4 w-20 rounded bg-[var(--color-surface)] animate-pulse mb-2" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-20 rounded-full bg-[var(--color-surface)] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Config block skeleton */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] p-4">
        <div className="h-4 w-24 rounded bg-[var(--color-surface)] animate-pulse mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-[var(--color-surface)] animate-pulse mb-2"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        ))}
      </div>
    </div>
  );
}
