"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto px-6 py-32 text-center">
      <p className="text-sm font-mono text-text-secondary uppercase tracking-wider mb-4">Error</p>
      <h2 className="text-2xl font-bold mb-3 tracking-tight">Something went wrong</h2>
      <p className="text-sm text-text-secondary mb-8">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="text-sm px-5 py-2 rounded-md border border-border hover:border-text-secondary hover:text-text transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
