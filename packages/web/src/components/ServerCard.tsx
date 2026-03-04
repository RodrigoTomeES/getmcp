import Link from "next/link";
import { compactNumber } from "@/lib/format";
import { Star, Download, BadgeCheck } from "lucide-react";

export type ServerCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categories?: string[];
  author?: string;
  runtime?: string;
  isRemote: boolean;
  envCount: number;
  stars?: number;
  downloads?: number;
  isOfficial?: boolean;
};

export function ServerCard({ server }: { server: ServerCardData }) {
  const transport = server.isRemote ? "remote" : "stdio";
  const hasStats =
    (server.stars != null && server.stars > 0) ||
    (server.downloads != null && server.downloads > 0);
  const hasCategories = server.categories && server.categories.length > 0;
  const hasMetadata = hasStats || server.runtime || hasCategories || server.envCount > 0;

  return (
    <Link
      href={`/servers/${server.slug}`}
      className="group flex flex-col rounded-lg border border-border bg-surface p-5 hover:bg-surface-hover hover:border-accent/50 transition-all"
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 className="font-semibold text-lg group-hover:text-accent transition-colors leading-snug inline-flex items-baseline">
          {server.name}

          {server.isOfficial && (
            <span role="img" aria-label="Official MCP server" title="Official MCP server">
              <BadgeCheck className="h-[1ch] text-official shrink-0" aria-hidden="true" />
            </span>
          )}
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            server.isRemote
              ? "bg-transport-remote-bg text-transport-remote"
              : "bg-transport-stdio-bg text-transport-stdio"
          }`}
        >
          <span className="sr-only">Transport: </span>
          {transport}
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-3 line-clamp-2 leading-relaxed">
        {server.description}
      </p>

      {hasMetadata && (
        <div className="flex flex-col gap-2 mt-auto">
          {/* Row 1: metrics + runtime */}
          {(hasStats || server.runtime) && (
            <div className="flex items-center gap-2 flex-wrap">
              {server.stars != null && server.stars > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary inline-flex items-center gap-1"
                  aria-label={`${server.stars.toLocaleString()} GitHub stars`}
                >
                  <Star className="w-3 h-3" aria-hidden="true" />
                  <span aria-hidden="true">{compactNumber(server.stars)}</span>
                </span>
              )}
              {server.downloads != null && server.downloads > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary inline-flex items-center gap-1"
                  aria-label={`${server.downloads.toLocaleString()} downloads per week`}
                >
                  <Download className="w-3 h-3" aria-hidden="true" />
                  <span aria-hidden="true">
                    {compactNumber(server.downloads)}
                    <span className="opacity-60">/w</span>
                  </span>
                </span>
              )}
              {server.runtime && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary font-mono">
                  {server.runtime}
                </span>
              )}
            </div>
          )}
          {/* Row 2: categories + env vars */}
          {(hasCategories || server.envCount > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {server.categories?.map((cat) => (
                <span
                  key={cat}
                  className="text-xs px-2 py-0.5 rounded-full bg-tag-bg text-tag-text"
                >
                  {cat}
                </span>
              ))}
              {server.envCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning">
                  {server.envCount} env var{server.envCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
