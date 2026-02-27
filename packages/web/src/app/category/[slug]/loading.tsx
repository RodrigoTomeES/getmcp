export default function CategoryLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 animate-pulse">
      <div className="h-4 w-48 bg-surface rounded mb-8" />
      <div className="mb-10">
        <div className="h-8 w-72 bg-surface rounded mb-3" />
        <div className="h-5 w-96 bg-surface rounded mb-2" />
        <div className="h-4 w-24 bg-surface rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-surface rounded-lg border border-border" />
        ))}
      </div>
    </div>
  );
}
