import type { RegistryEntryType } from "@getmcp/core";

export function ServerCard({ server }: { server: RegistryEntryType }) {
  const isRemote = "url" in server.config;
  const transport = isRemote ? "remote" : "stdio";
  const envCount = server.requiredEnvVars.length;

  return (
    <a
      href={`/servers/${server.id}`}
      className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-accent)] transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-lg">{server.name}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            isRemote
              ? "bg-purple-500/10 text-purple-400"
              : "bg-green-500/10 text-green-400"
          }`}
        >
          {transport}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
        {server.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {server.categories?.map((cat) => (
          <span
            key={cat}
            className="text-xs px-2 py-0.5 rounded bg-[var(--color-tag-bg)] text-[var(--color-tag-text)]"
          >
            {cat}
          </span>
        ))}
        {envCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
            {envCount} env var{envCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {server.author && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-3">
          by {server.author}
        </p>
      )}
    </a>
  );
}
