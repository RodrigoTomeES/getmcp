import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generators } from "@getmcp/generators";
import type { AppIdType } from "@getmcp/core";
import { getServer } from "@getmcp/registry";
import { CodeBlock } from "@/components/CodeBlock";
import { PackageManagerCommand } from "@/components/PackageManagerCommand";
import { GUIDES, GUIDE_SLUGS, type GuideData } from "@/lib/guide-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((app) => ({ app }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ app: string }>;
}): Promise<Metadata> {
  return params.then(({ app }) => {
    const guide = GUIDES[app];
    if (!guide) return { title: "Not Found" };

    return {
      title: `How to Install MCP Servers in ${guide.name}`,
      description: `Step-by-step guide to install and configure MCP servers in ${guide.name}. Covers config format, file location, quick install with getmcp CLI, and troubleshooting.`,
      keywords: [
        `${guide.name} MCP`,
        `${guide.name} MCP server`,
        `${guide.name} MCP setup`,
        `install MCP ${guide.name}`,
        "MCP server",
        "getmcp",
      ],
      alternates: { canonical: `/guides/${app}` },
      openGraph: {
        title: `How to Install MCP Servers in ${guide.name} \u2014 getmcp`,
        description: `Step-by-step guide to install and configure MCP servers in ${guide.name}.`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `How to Install MCP Servers in ${guide.name} \u2014 getmcp`,
        description: `Step-by-step guide to install and configure MCP servers in ${guide.name}.`,
      },
    };
  });
}

/**
 * Generate a sample config for this app using the first popular server that
 * exists in the registry.
 */
function getSampleConfig(appSlug: string, guide: GuideData): string | null {
  const gen = generators[appSlug as AppIdType];
  if (!gen) return null;

  for (const serverId of guide.popularServers) {
    const server = getServer(serverId);
    if (server) {
      const config = gen.generate(serverId, server.config);
      return gen.serialize(config);
    }
  }
  return null;
}

export default async function GuidePage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const guide = GUIDES[app];
  if (!guide) notFound();

  const gen = generators[app as AppIdType];
  const sampleConfig = getSampleConfig(app, guide);
  const sampleServerId = guide.popularServers[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: `How to Install MCP Servers in ${guide.name}`,
      description: `Step-by-step guide to install and configure MCP servers in ${guide.name}.`,
      url: `https://getmcp.es/guides/${app}`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://getmcp.es/guides/${app}`,
      },
      author: { "@type": "Organization", name: "getmcp" },
      publisher: {
        "@type": "Organization",
        name: "getmcp",
        url: "https://getmcp.es",
      },
      inLanguage: "en",
      proficiencyLevel: "Beginner",
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
          name: "Guides",
          item: "https://getmcp.es/guides",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: guide.name,
          item: `https://getmcp.es/guides/${app}`,
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Home
        </Link>
        <span className="mx-2 text-text-secondary/50">/</span>
        <Link href="/guides" className="hover:text-text transition-colors">
          Guides
        </Link>
        <span className="mx-2 text-text-secondary/50">/</span>
        <span className="text-text">{guide.name}</span>
      </nav>

      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        How to Install MCP Servers in {guide.name}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mb-10">
        {guide.overview}
      </p>

      {/* Quick install */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Quick Install with getmcp</h2>
        <p className="text-text-secondary mb-4">
          The fastest way to install MCP servers in {guide.name} is with the getmcp CLI:
        </p>
        <PackageManagerCommand />
      </section>

      {/* Config format */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Configuration Format</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 py-5 border-y border-border mb-6">
          <div>
            <dt className="text-xs text-text-secondary uppercase tracking-wider mb-1">Format</dt>
            <dd className="font-mono text-sm">{guide.format}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary uppercase tracking-wider mb-1">Root Key</dt>
            <dd className="font-mono text-sm">{guide.rootKey}</dd>
          </div>
          {guide.configPaths.project && (
            <div>
              <dt className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                Project Config
              </dt>
              <dd className="font-mono text-sm break-all">{guide.configPaths.project}</dd>
            </div>
          )}
          {guide.configPaths.macos && (
            <div>
              <dt className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                Global Config (macOS / Linux)
              </dt>
              <dd className="font-mono text-sm break-all">{guide.configPaths.macos}</dd>
            </div>
          )}
          {guide.configPaths.windows && (
            <div>
              <dt className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                Global Config (Windows)
              </dt>
              <dd className="font-mono text-sm break-all">{guide.configPaths.windows}</dd>
            </div>
          )}
          {guide.configPaths.linux && guide.configPaths.linux !== guide.configPaths.macos && (
            <div>
              <dt className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                Global Config (Linux)
              </dt>
              <dd className="font-mono text-sm break-all">{guide.configPaths.linux}</dd>
            </div>
          )}
        </dl>

        {sampleConfig && (
          <div>
            <p className="text-text-secondary mb-3">
              Example configuration for the{" "}
              <Link href={`/servers/${sampleServerId}`} className="text-accent hover:underline">
                {sampleServerId}
              </Link>{" "}
              server:
            </p>
            <CodeBlock label={guide.format}>{sampleConfig}</CodeBlock>
          </div>
        )}
      </section>

      {/* Prerequisites */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
        <ul className="space-y-2">
          {guide.prerequisites.map((req) => (
            <li key={req} className="flex items-start gap-2 text-text-secondary">
              <span className="text-accent mt-1 shrink-0" aria-hidden="true">
                &bull;
              </span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Popular servers */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Popular Servers for {guide.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guide.popularServers.map((id) => {
            const server = getServer(id);
            if (!server) return null;
            return (
              <Link
                key={id}
                href={`/servers/${id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:bg-surface-hover hover:border-accent/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{server.name}</p>
                  <p className="text-xs text-text-secondary truncate">{server.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
        <ul className="space-y-4">
          {guide.troubleshooting.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-warning mt-0.5 shrink-0 text-xs leading-5" aria-hidden="true">
                &#x25B8;
              </span>
              <span className="text-text-secondary text-sm leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Official docs link */}
      {gen?.app?.docsUrl && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Official Documentation</h2>
          <a
            href={gen.app.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-sm"
          >
            {guide.name} MCP documentation
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </section>
      )}
    </div>
  );
}
