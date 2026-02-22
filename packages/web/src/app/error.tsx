"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <h2 className="text-xl font-semibold mb-3">Something went wrong</h2>
      <p className="text-sm text-text-secondary mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="text-sm px-4 py-2 rounded-md border border-border hover:border-text-secondary transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
