import Link from "next/link";
import { notFound } from "next/navigation";
import { getServer, getAllServers } from "@getmcp/registry";
import type { RegistryEntryType } from "@getmcp/core";
import { ConfigViewer } from "@/components/ConfigViewer";
import { PackageManagerCommand } from "@/components/PackageManagerCommand";
import { MetaItem } from "@/components/MetaItem";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.id }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // This runs at build time for static export
  return params.then(({ id }) => {
    const server = getServer(id);
    if (!server) return { title: "Not Found" };

    const title = `${server.name} — getmcp`;
    const description = server.description;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image" as const,
        title,
        description,
      },
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-10" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Servers
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-text">{server.name}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-8">
        {server.categories && server.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {server.categories.map((cat) => (
              <span key={cat} className="text-xs px-3 py-1 rounded-full bg-tag-bg text-tag-text">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold tracking-tight">{server.name}</h1>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isRemote
                ? "bg-transport-remote-bg text-transport-remote"
                : "bg-transport-stdio-bg text-transport-stdio"
            }`}
          >
            {transport}
          </span>
        </div>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
          {server.description}
        </p>
      </div>

      {/* Categories and links row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-8">
        {(server.repository || server.homepage) && (
          <div className="flex items-center gap-4">
            {server.repository && (
              <a
                href={server.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline transition-colors"
              >
                Repository
              </a>
            )}
            {server.homepage && (
              <a
                href={server.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline transition-colors"
              >
                Homepage
              </a>
            )}
          </div>
        )}
      </div>

      {/* Metadata grid */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 py-6 border-y border-border mb-10">
        {server.author && <MetaItem label="Author" value={server.author} />}
        {server.runtime && <MetaItem label="Runtime" value={server.runtime} />}
        {server.package && <MetaItem label="Package" value={server.package} mono />}
        {isRemote && "url" in server.config && (
          <MetaItem label="URL" value={server.config.url} mono />
        )}
        {!isRemote && "command" in server.config && (
          <MetaItem
            label="Command"
            value={[server.config.command, ...(server.config.args ?? [])].join(" ")}
            mono
          />
        )}
      </dl>

      {/* Required env vars */}
      {server.requiredEnvVars.length > 0 && (
        <div className="mb-8 rounded-lg border border-warning-border bg-warning-subtle p-4">
          <h3 className="text-sm font-medium text-warning mb-2">Required Environment Variables</h3>
          <ul className="space-y-1">
            {server.requiredEnvVars.map((envVar) => (
              <li key={envVar} className="text-sm">
                <code className="text-warning-light bg-code-bg px-1.5 py-0.5 rounded">
                  {envVar}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CLI install command */}
      <div className="mb-12">
        <h3 className="text-lg font-semibold mb-4">Install</h3>
        <PackageManagerCommand serverId={server.id} />
      </div>

      {/* Config generator */}
      <ConfigViewer serverName={server.id} config={server.config} />
    </div>
  );
}
