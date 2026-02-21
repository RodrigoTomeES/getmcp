export default function DocsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero skeleton */}
      <div className="mb-16">
        <div className="h-10 w-64 rounded bg-[var(--color-surface)] animate-pulse mb-4" />
        <div className="h-5 w-full max-w-lg rounded bg-[var(--color-surface)] animate-pulse" />
      </div>

      {/* Section skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mb-16">
          <div className="h-7 w-48 rounded bg-[var(--color-surface)] animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-[var(--color-surface)] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[var(--color-surface)] animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-[var(--color-surface)] animate-pulse" />
          </div>
          {i % 2 === 0 && (
            <div className="mt-4 h-32 w-full rounded-lg bg-[var(--color-code-bg)] animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}
