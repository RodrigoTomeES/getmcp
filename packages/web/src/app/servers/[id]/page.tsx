import { notFound } from "next/navigation";
import { getServer, getAllServers } from "@mcp-hub/registry";
import type { RegistryEntryType } from "@mcp-hub/core";
import { ConfigViewer } from "@/components/ConfigViewer";

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.id }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // This runs at build time for static export
  return params.then(({ id }) => {
    const server = getServer(id);
    if (!server) return { title: "Not Found" };
    return {
      title: `${server.name} — MCP Hub`,
      description: server.description,
    };
  });
}

export default async function ServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getServer(id);

  if (!server) {
    notFound();
  }

  return <ServerDetail server={server} />;
}

function ServerDetail({ server }: { server: RegistryEntryType }) {
  const isRemote = "url" in server.config;
  const transport = isRemote ? "remote" : "stdio";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--color-text-secondary)] mb-6">
        <a href="/" className="hover:text-[var(--color-text)] transition-colors">
          Servers
        </a>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text)]">{server.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-3xl font-bold">{server.name}</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 ${
              isRemote
                ? "bg-purple-500/10 text-purple-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            {transport}
          </span>
        </div>
        <p className="text-lg text-[var(--color-text-secondary)]">
          {server.description}
        </p>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {server.author && (
          <MetaItem label="Author" value={server.author} />
        )}
        {server.runtime && (
          <MetaItem label="Runtime" value={server.runtime} />
        )}
        {server.package && (
          <MetaItem label="Package" value={server.package} mono />
        )}
        {isRemote && "url" in server.config && (
          <MetaItem label="URL" value={server.config.url} mono />
        )}
        {!isRemote && "command" in server.config && (
          <MetaItem
            label="Command"
            value={[
              server.config.command,
              ...(server.config.args ?? []),
            ].join(" ")}
            mono
          />
        )}
      </div>

      {/* Categories */}
      {server.categories && server.categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {server.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs px-3 py-1 rounded-full bg-[var(--color-tag-bg)] text-[var(--color-tag-text)]"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Required env vars */}
      {server.requiredEnvVars.length > 0 && (
        <div className="mb-8 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="text-sm font-medium text-amber-400 mb-2">
            Required Environment Variables
          </h3>
          <ul className="space-y-1">
            {server.requiredEnvVars.map((envVar) => (
              <li key={envVar} className="text-sm">
                <code className="text-amber-300 bg-[var(--color-code-bg)] px-1.5 py-0.5 rounded">
                  {envVar}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Links */}
      <div className="flex gap-4 mb-8">
        {server.repository && (
          <a
            href={server.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            Repository
          </a>
        )}
        {server.homepage && (
          <a
            href={server.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            Homepage
          </a>
        )}
      </div>

      {/* CLI install hint */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-8">
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">
          Install with the CLI:
        </p>
        <code className="text-[var(--color-accent)]">
          npx @mcp-hub/cli add {server.id}
        </code>
      </div>

      {/* Config generator */}
      <ConfigViewer serverName={server.id} config={server.config} />
    </div>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-xs text-[var(--color-text-secondary)] mb-1">
        {label}
      </p>
      <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
