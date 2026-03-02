import Link from "next/link";

export type ServerCardData = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  runtime?: string;
  isRemote: boolean;
  envCount: number;
  stars?: number;
  downloads?: number;
};

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function ServerCard({ server }: { server: ServerCardData }) {
  const transport = server.isRemote ? "remote" : "stdio";

  return (
    <Link
      href={`/servers/${server.id}`}
      className="group flex flex-col rounded-lg border border-border bg-surface p-5 hover:bg-surface-hover hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-lg group-hover:text-accent transition-colors leading-snug">
          {server.name}
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
            server.isRemote
              ? "bg-transport-remote-bg text-transport-remote"
              : "bg-transport-stdio-bg text-transport-stdio"
          }`}
        >
          {transport}
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-4 line-clamp-2 leading-relaxed">
        {server.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-auto">
        {server.stars != null && server.stars > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
            </svg>
            {compactNumber(server.stars)}
          </span>
        )}
        {server.downloads != null && server.downloads > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
            </svg>
            {compactNumber(server.downloads)}/w
          </span>
        )}
        {server.categories?.map((cat) => (
          <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-tag-bg text-tag-text">
            {cat}
          </span>
        ))}
        {server.runtime && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary font-mono">
            {server.runtime}
          </span>
        )}
        {server.envCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning">
            {server.envCount} env var{server.envCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
