import Link from "next/link";
import { notFound } from "next/navigation";
import { getServer, getAllServers } from "@getmcp/registry";
import { generators } from "@getmcp/generators";
import type { RegistryEntryType, AppIdType } from "@getmcp/core";
import { ConfigViewer, type PreGeneratedConfig } from "@/components/ConfigViewer";
import { PackageManagerCommand } from "@/components/PackageManagerCommand";
import { MetaItem } from "@/components/MetaItem";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.id }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const server = getServer(id);
    if (!server) return { title: "Not Found" };

    const title = server.name;
    const description = server.description;

    return {
      title,
      description,
      alternates: {
        canonical: `/servers/${id}`,
      },
      openGraph: {
        title: `${server.name} \u2014 getmcp`,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image" as const,
        title: `${server.name} \u2014 getmcp`,
        description,
      },
    };
  });
}

function preGenerateConfigs(
  serverId: string,
  config: RegistryEntryType["config"],
): Record<string, PreGeneratedConfig> {
  const appIds = Object.keys(generators) as AppIdType[];
  return Object.fromEntries(
    appIds.map((appId) => {
      const gen = generators[appId];
      const generated = gen.generate(serverId, config);
      return [
        appId,
        {
          serialized: gen.serialize(generated),
          configPath:
            gen.app.configPaths !== null && gen.app.globalConfigPaths !== null
              ? `${gen.app.configPaths} (project) or ${gen.app.globalConfigPaths?.darwin ?? "\u2014"} (global)`
              : (gen.app.configPaths ??
                gen.app.globalConfigPaths?.darwin ??
                gen.app.globalConfigPaths?.win32 ??
                gen.app.globalConfigPaths?.linux ??
                "\u2014"),
          format: gen.app.configFormat.toUpperCase(),
          docsUrl: gen.app.docsUrl,
        },
      ];
    }),
  );
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
  const configs = preGenerateConfigs(server.id, server.config);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: server.name,
    description: server.description,
    applicationCategory: "DeveloperApplication",
    ...(server.author && { author: { "@type": "Person", name: server.author } }),
    ...(server.repository && { url: server.repository }),
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-10" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Servers
        </Link>
        <span className="mx-2 text-text-secondary/50">/</span>
        <span className="text-text">{server.name}</span>
      </nav>

      {/* Categories */}
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
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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

      {/* Links */}
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
            {server.homepage && server.repository !== server.homepage && (
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
          <h2 className="text-sm font-medium text-warning mb-2">Required Environment Variables</h2>
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
        <h2 className="text-lg font-semibold mb-4">Install</h2>
        <PackageManagerCommand serverId={server.id} />
      </div>

      {/* Config generator */}
      <ConfigViewer configs={configs} />
    </div>
  );
}
