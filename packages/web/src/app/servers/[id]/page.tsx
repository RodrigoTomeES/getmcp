import Link from "next/link";
import { notFound } from "next/navigation";
import { getServer, getAllServers } from "@getmcp/registry";
import { generators } from "@getmcp/generators";
import type { RegistryEntryType, AppIdType } from "@getmcp/core";
import { ConfigViewer, type PreGeneratedConfig } from "@/components/ConfigViewer";
import { PackageManagerCommand } from "@/components/PackageManagerCommand";
import { MetaItem } from "@/components/MetaItem";
import { ServerCard, type ServerCardData } from "@/components/ServerCard";
import { GUIDE_SLUGS } from "@/lib/guide-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.id }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const server = getServer(id);
    if (!server) return { title: "Not Found" };

    const title = `${server.name} MCP Server`;
    const description = `${server.description}. Install with: npx @getmcp/cli add ${id}`;

    return {
      title,
      description,
      keywords: [
        server.name,
        `${server.name} MCP`,
        `${server.name} MCP server`,
        ...server.categories,
        "MCP server",
        "getmcp",
        "install MCP",
      ],
      alternates: {
        canonical: `/servers/${id}`,
      },
      openGraph: {
        title: `${server.name} MCP Server \u2014 getmcp`,
        description,
        type: "website",
      },
      twitter: {
        card: "summary_large_image" as const,
        title: `${server.name} MCP Server \u2014 getmcp`,
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

function runtimeToRequirements(runtime?: string): string {
  const map: Record<string, string> = {
    node: "Node.js 18+",
    docker: "Docker Engine",
    python: "Python 3.10+",
    binary: "Pre-built binary",
  };
  return runtime ? (map[runtime] ?? runtime) : "Node.js 18+";
}

function ServerDetail({ server }: { server: RegistryEntryType }) {
  const isRemote = "url" in server.config;
  const transport = isRemote ? "remote" : "stdio";
  const configs = preGenerateConfigs(server.id, server.config);

  const primaryCategory = server.categories?.[0];
  const relatedServers: ServerCardData[] = primaryCategory
    ? getAllServers()
        .filter((s) => s.id !== server.id && s.categories?.includes(primaryCategory))
        .slice(0, 4)
        .map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          categories: s.categories,
          author: s.author,
          runtime: s.runtime,
          isRemote: "url" in s.config,
          envCount: s.requiredEnvVars.length,
        }))
    : [];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${server.name} MCP Server`,
      description: server.description,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "MCP Server",
      operatingSystem: "Windows, macOS, Linux",
      softwareRequirements: runtimeToRequirements(server.runtime),
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      ...(server.author && {
        author: { "@type": "Organization", name: server.author },
      }),
      url: `https://getmcp.es/servers/${server.id}`,
      ...(server.repository && { downloadUrl: server.repository }),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://getmcp.es/servers/${server.id}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://getmcp.es",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Servers",
          item: "https://getmcp.es/servers",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: server.name,
          item: `https://getmcp.es/servers/${server.id}`,
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-10" aria-label="Breadcrumb">
        <Link href="/servers" className="hover:text-text transition-colors">
          Servers
        </Link>
        <span className="mx-2 text-text-secondary/50">/</span>
        <span className="text-text">{server.name}</span>
      </nav>

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

      {/* Categories + Links */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-8">
        {server.categories && server.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {server.categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat}`}
                className="text-xs px-3 py-1 rounded-full bg-tag-bg text-tag-text hover:bg-tag-bg/80 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}
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
                <span className="sr-only"> (opens in new tab)</span>
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
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Getting started */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3 text-text-secondary text-sm">
          <p>
            <span className="text-text font-medium">1. Prerequisites:</span>{" "}
            {server.runtime === "docker"
              ? "Docker Engine installed and running"
              : server.runtime === "python"
                ? "Python 3.10+ installed"
                : server.runtime === "binary"
                  ? "Download the pre-built binary for your platform"
                  : "Node.js 18+ installed"}
          </p>
          {server.requiredEnvVars.length > 0 && (
            <p>
              <span className="text-text font-medium">2. Set environment variables:</span>{" "}
              {server.requiredEnvVars.map((v) => (
                <code key={v} className="text-accent bg-code-bg px-1 py-0.5 rounded mx-0.5">
                  {v}
                </code>
              ))}
            </p>
          )}
          <p>
            <span className="text-text font-medium">
              {server.requiredEnvVars.length > 0 ? "3" : "2"}. Install:
            </span>{" "}
            Run the install command below — getmcp will auto-detect your installed AI apps.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {GUIDE_SLUGS.slice(0, 5).map((slug) => (
            <Link
              key={slug}
              href={`/guides/${slug}`}
              className="text-xs text-accent hover:underline"
            >
              {slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} guide &rarr;
            </Link>
          ))}
        </div>
      </section>

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
        <h2 className="text-xl font-semibold mb-4">Install</h2>
        <PackageManagerCommand serverId={server.id} />
        <p className="text-xs text-text-secondary mt-3">
          This is a community-contributed server.{" "}
          <Link href="/docs#security-disclaimer" className="text-accent hover:underline">
            Review source before installing
          </Link>
          .
        </p>
      </div>

      {/* Config generator */}
      <ConfigViewer configs={configs} />

      {/* Metadata grid */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 py-6 border-y border-border my-10">
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

      {/* Related servers */}
      {relatedServers.length > 0 && (
        <section className="mt-16 pt-10 border-t border-border">
          <h2 className="text-xl font-semibold mb-6">Related Servers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedServers.map((s) => (
              <ServerCard key={s.id} server={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
