export default function GuideLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-16 motion-safe:animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-surface rounded mb-8" />

      {/* Heading skeleton */}
      <div className="h-9 w-full max-w-lg bg-surface rounded mb-4" />

      {/* Overview skeleton */}
      <div className="space-y-2 mb-10">
        <div className="h-5 w-full bg-surface rounded" />
        <div className="h-5 w-5/6 bg-surface rounded" />
        <div className="h-5 w-4/6 bg-surface rounded" />
      </div>

      {/* Quick install section */}
      <div className="mb-12">
        <div className="h-6 w-64 bg-surface rounded mb-4" />
        <div className="h-4 w-72 bg-surface rounded mb-4" />
        <div className="h-14 w-full bg-surface rounded-lg border border-border" />
      </div>

      {/* Config format section */}
      <div className="mb-12">
        <div className="h-6 w-52 bg-surface rounded mb-4" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-5 border-y border-border mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-surface rounded mb-2" />
              <div className="h-4 w-40 bg-surface rounded" />
            </div>
          ))}
        </div>
        <div className="h-4 w-64 bg-surface rounded mb-3" />
        <div className="h-48 w-full bg-surface rounded-lg border border-border" />
      </div>

      {/* Prerequisites section */}
      <div className="mb-12">
        <div className="h-6 w-36 bg-surface rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-80 bg-surface rounded" />
          ))}
        </div>
      </div>

      {/* Popular servers section */}
      <div className="mb-12">
        <div className="h-6 w-56 bg-surface rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-surface rounded-lg border border-border" />
          ))}
        </div>
      </div>

      {/* Troubleshooting section */}
      <div className="mb-12">
        <div className="h-6 w-44 bg-surface rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-surface rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
