import Link from "next/link";
import type { RegistryEntryType } from "@getmcp/core";

export function ServerCard({ server }: { server: RegistryEntryType }) {
  const isRemote = "url" in server.config;
  const transport = isRemote ? "remote" : "stdio";
  const envCount = server.requiredEnvVars.length;

  return (
    <Link
      href={`/servers/${server.id}`}
      className="group flex flex-col rounded-lg border border-border bg-surface p-5 hover:bg-surface-hover hover:border-accent/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-lg group-hover:text-accent transition-colors leading-snug">
          {server.name}
        </h3>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
            isRemote
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
          <span key={cat} className="text-xs px-2 py-0.5 rounded bg-tag-bg text-tag-text">
            {cat}
          </span>
        ))}
        {envCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded bg-warning-bg text-warning">
            {envCount} env var{envCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
