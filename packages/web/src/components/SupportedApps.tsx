import Link from "next/link";
import { generators } from "@getmcp/generators";

export function SupportedApps() {
  const apps = Object.values(generators).map((g) => ({
    id: g.app.id,
    name: g.app.name,
    format: g.app.configFormat.toUpperCase(),
  }));

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold">{apps.length} Supported Apps</h2>
        <Link href="/guides" className="text-sm text-accent hover:underline transition-colors">
          See setup guides &rarr;
        </Link>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        getmcp generates the correct config format for each app automatically.
      </p>
      <div className="flex flex-wrap gap-2">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={`/guides/${app.id}`}
            className="group flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 hover:bg-surface-hover hover:border-accent/50 transition-colors"
          >
            <span className="text-sm font-medium group-hover:text-accent transition-colors">
              {app.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary font-mono">
              {app.format}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
