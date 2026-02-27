export default function GuidesLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-surface rounded mb-8" />

      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-8 w-56 bg-surface rounded mb-3" />
        <div className="h-5 w-96 bg-surface rounded" />
      </div>

      {/* Guide grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-32 bg-surface rounded-lg border border-border" />
        ))}
      </div>
    </div>
  );
}
