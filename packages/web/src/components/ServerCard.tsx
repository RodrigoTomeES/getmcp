import Link from "next/link";

export type ServerCardData = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  author?: string;
  runtime?: string;
  isRemote: boolean;
  envCount: number;
};

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
          <span className="text-xs px-2 py-0.5 rounded bg-warning-bg text-warning">
            {server.envCount} env var{server.envCount > 1 ? "s" : ""}
          </span>
        )}
        {server.author && (
          <span className="text-xs text-text-secondary truncate ml-auto">by {server.author}</span>
        )}
      </div>
    </Link>
  );
}
