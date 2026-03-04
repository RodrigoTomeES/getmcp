import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerBySlug, getAllServers, getServerMetrics } from "@getmcp/registry";
import { generators } from "@getmcp/generators";
import type { AppIdType } from "@getmcp/core";
import type { InternalRegistryEntry } from "@getmcp/registry";
import { ConfigViewer, type PreGeneratedConfig } from "@/components/ConfigViewer";
import { PackageManagerCommand } from "@/components/PackageManagerCommand";
import { ServerCard, type ServerCardData } from "@/components/ServerCard";
import { ServerSidebar } from "@/components/ServerSidebar";
import { Lock, BadgeCheck } from "lucide-react";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import { SITE_URL } from "@/lib/constants";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const server = getServerBySlug(id);
    if (!server) return { title: "Not Found" };

    const title = `${server.name} MCP Server`;
    const description = `${server.description}. Install with: npx @getmcp/cli add ${server.id}`;

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
  config: InternalRegistryEntry["config"],
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
  const server = getServerBySlug(id);

  if (!server) {
    notFound();
  }

  const configs = preGenerateConfigs(server.id, server.config);
  const metrics = getServerMetrics(server.id);

  const primaryCategory = server.categories?.[0];
  const relatedServers: ServerCardData[] = primaryCategory
    ? getAllServers()
        .filter((s) => s.id !== server.id && s.categories?.includes(primaryCategory))
        .slice(0, 4)
        .map((s) => {
          const m = getServerMetrics(s.id);
          return {
            id: s.id,
            slug: s.slug,
            name: s.name,
            description: s.description,
            categories: s.categories,
            runtime: s.runtime,
            isRemote: "url" in s.config,
            envCount: s.requiredEnvVars.length,
            stars: m?.github?.stars,
            downloads: m?.npm?.weeklyDownloads ?? m?.pypi?.weeklyDownloads,
            isOfficial: s.isOfficial,
          };
        })
    : [];

  return (
    <ServerDetail
      server={server}
      configs={configs}
      metrics={metrics}
      relatedServers={relatedServers}
    />
  );
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

type Metrics = ReturnType<typeof getServerMetrics>;

function ServerDetail({
  server,
  configs,
  metrics,
  relatedServers,
}: {
  server: InternalRegistryEntry;
  configs: Record<string, PreGeneratedConfig>;
  metrics: Metrics;
  relatedServers: ServerCardData[];
}) {
  const isRemote = "url" in server.config;
  const transport = isRemote ? "remote" : "stdio";
  const version = metrics?.npm?.latestVersion ?? metrics?.pypi?.latestVersion ?? server.version;

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
      ...(version && { softwareVersion: version }),
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      ...(server.author && {
        author: { "@type": "Organization", name: server.author },
      }),
      url: `${SITE_URL}/servers/${server.slug}`,
      ...(server.repository && { downloadUrl: server.repository }),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/servers/${server.slug}`,
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
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Servers",
          item: `${SITE_URL}/servers`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: server.name,
          item: `${SITE_URL}/servers/${server.slug}`,
        },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-10" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/servers" className="hover:text-text transition-colors">
              Servers
            </Link>
          </li>
          <li className="text-text-secondary/50" aria-hidden="true">
            /
          </li>
          <li aria-current="page" className="text-text">
            {server.name}
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {server.icons?.[0]?.src && (
            <Image
              src={server.icons[0].src}
              alt={`${server.name} icon`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg shrink-0"
              unoptimized
            />
          )}
          <h1 className="text-3xl font-bold tracking-tight inline-flex items-baseline gap-1">
            {server.name}
            {server.isOfficial && (
              <span role="img" aria-label="Official MCP server" title="Official MCP server">
                <BadgeCheck className="h-[1ch] text-official shrink-0" aria-hidden="true" />
              </span>
            )}
          </h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
              isRemote
                ? "bg-transport-remote-bg text-transport-remote"
                : "bg-transport-stdio-bg text-transport-stdio"
            }`}
          >
            {transport}
          </span>
          {metrics?.github?.archived && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning font-medium shrink-0">
              Archived
            </span>
          )}
        </div>

        <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-5">
          {server.description}
        </p>

        {/* Categories */}
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
      </section>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-10">
          {/* Getting Started */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Getting Started</h2>
            <PackageManagerCommand serverId={server.id} />
            <p className="text-xs text-text-secondary mt-2">
              Requires {runtimeToRequirements(server.runtime)}.{" "}
              {server.isOfficial
                ? `Official server${server.author ? ` by ${server.author}` : ""}.`
                : "Community-contributed server."}{" "}
              <Link href="/docs#security-disclaimer" className="text-accent hover:underline">
                Review source before installing
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {GUIDE_SLUGS.slice(0, 4).map((slug) => (
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
            <section className="rounded-lg border border-warning-border bg-warning-subtle p-4">
              <h2 className="text-sm font-medium text-warning mb-2">
                Required Environment Variables
              </h2>
              <ul className="space-y-2">
                {server.requiredEnvVars.map((envVar) => {
                  const detail = server.envVarDetails?.find((d) => d.name === envVar);
                  return (
                    <li key={envVar} className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <code className="text-warning-light bg-code-bg px-1.5 py-0.5 rounded">
                          {envVar}
                        </code>
                        {detail?.isSecret && (
                          <span className="text-warning-light text-xs" title="Secret value">
                            <Lock className="w-3.5 h-3.5 inline" aria-label="Secret" />
                          </span>
                        )}
                      </div>
                      {detail?.description && (
                        <p className="text-xs text-text-secondary mt-0.5 ml-0.5">
                          {detail.description}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Config generator */}
          <ConfigViewer configs={configs} />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6 lg:self-start">
          <ServerSidebar server={server} metrics={metrics} />
        </aside>
      </div>

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
