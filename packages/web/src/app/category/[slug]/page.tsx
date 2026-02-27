import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getServersByCategory } from "@getmcp/registry";
import { ServerCard, type ServerCardData } from "@/components/ServerCard";
import { CATEGORY_NAMES, CATEGORY_DESCRIPTIONS } from "@/lib/categories";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCategories().map((cat) => ({ slug: cat }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const name = CATEGORY_NAMES[slug] ?? slug;
    const description = CATEGORY_DESCRIPTIONS[slug] ?? `Browse ${name} MCP servers.`;
    const servers = getServersByCategory(slug);

    return {
      title: `${name} MCP Servers \u2014 Browse & Install`,
      description: `${description} ${servers.length} servers available. Install with one command across 19 AI apps.`,
      keywords: [name, `${name} MCP`, `${name} MCP servers`, "MCP server", "getmcp"],
      alternates: {
        canonical: `/category/${slug}`,
      },
      openGraph: {
        title: `${name} MCP Servers \u2014 getmcp`,
        description: `${description} Install with one command across 19 AI apps.`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} MCP Servers \u2014 getmcp`,
        description: `${description} Install with one command across 19 AI apps.`,
      },
    };
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = CATEGORY_NAMES[slug];
  if (!name) notFound();

  const servers = getServersByCategory(slug);
  const description = CATEGORY_DESCRIPTIONS[slug] ?? "";

  const minimalServers: ServerCardData[] = servers.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    categories: s.categories,
    isRemote: "url" in s.config,
    envCount: s.requiredEnvVars.length,
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${name} MCP Servers`,
      description,
      url: `https://getmcp.es/category/${slug}`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://getmcp.es/category/${slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${name} MCP Servers`,
      numberOfItems: servers.length,
      itemListElement: minimalServers.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
        url: `https://getmcp.es/servers/${s.id}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://getmcp.es" },
        { "@type": "ListItem", position: 2, name: "Servers", item: "https://getmcp.es/servers" },
        {
          "@type": "ListItem",
          position: 3,
          name,
          item: `https://getmcp.es/category/${slug}`,
        },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
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
        <Link href="/servers" className="hover:text-text transition-colors">
          Servers
        </Link>
        <span className="mx-2 text-text-secondary/50">/</span>
        <span className="text-text">{name}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">{name} MCP Servers</h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">{description}</p>
        <p className="text-sm text-text-secondary mt-2">
          {servers.length} server{servers.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Server grid */}
      {minimalServers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {minimalServers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-text-secondary">
          <p className="text-lg mb-2">No servers in this category yet</p>
          <p className="text-sm">
            Check back soon or{" "}
            <Link href="/servers" className="text-accent hover:underline">
              browse all servers
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
