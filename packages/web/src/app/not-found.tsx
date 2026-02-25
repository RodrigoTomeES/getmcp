import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-32 text-center">
      <p className="text-sm font-mono text-text-secondary uppercase tracking-wider mb-4">
        Error 404
      </p>
      <h1 className="text-5xl font-bold mb-4 tracking-tight">Page not found</h1>
      <p className="text-lg text-text-secondary mb-10 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
      >
        Browse servers
      </Link>
    </div>
  );
}
