import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-lg text-text-secondary mb-8">
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
