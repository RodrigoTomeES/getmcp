export default function DocsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex gap-12">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-48 shrink-0">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-surface motion-safe:animate-pulse"
              style={{ width: `${60 + (i % 3) * 20}%` }}
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="min-w-0 max-w-3xl flex-1">
        {/* Hero skeleton */}
        <div className="mb-16">
          <div className="h-10 w-64 rounded bg-surface motion-safe:animate-pulse mb-4" />
          <div className="h-5 w-full max-w-lg rounded bg-surface motion-safe:animate-pulse" />
        </div>

        {/* Section skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-16">
            <div className="h-7 w-48 rounded bg-surface motion-safe:animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-surface motion-safe:animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-surface motion-safe:animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-surface motion-safe:animate-pulse" />
            </div>
            {i % 2 === 0 && (
              <div className="mt-4 h-32 w-full rounded-lg bg-code-bg motion-safe:animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
