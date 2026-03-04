import type { Metadata } from "next";
import Link from "next/link";
import { getAllServers, getCategories, getAllMetrics } from "@getmcp/registry";
import { SearchBar } from "@/components/SearchBar";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "MCP Server Directory — Browse & Install",
  description:
    "Browse and install MCP servers for Claude Desktop, VS Code, Cursor, and 16 more AI apps. Filter by category, search by name, and install with one command.",
  alternates: {
    canonical: "/servers",
  },
  openGraph: {
    title: "MCP Server Directory — getmcp",
    description:
      "Browse and install MCP servers for Claude Desktop, VS Code, Cursor, and 16 more AI apps.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Server Directory — getmcp",
    description:
      "Browse and install MCP servers for Claude Desktop, VS Code, Cursor, and 16 more AI apps.",
  },
};

export default function ServersPage() {
  const servers = getAllServers();
  const categories = getCategories();
  const count = servers.length;
  const metricsMap = getAllMetrics();

  const minimalServers = servers.map((s) => {
    const metrics = metricsMap.get(s.id);
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      categories: s.categories,
      runtime: s.runtime,
      isRemote: "url" in s.config,
      envCount: s.requiredEnvVars.length,
      stars: metrics?.github?.stars,
      downloads: metrics?.npm?.weeklyDownloads ?? metrics?.pypi?.weeklyDownloads,
      isOfficial: s.isOfficial,
    };
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "MCP Server Directory",
      description: `Browse and install ${count}+ MCP servers for 19 AI applications.`,
      url: `${SITE_URL}/servers`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/servers`,
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
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary mb-8">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-text transition-colors">
              Home
            </Link>
          </li>
          <li className="text-text-secondary/50" aria-hidden="true">
            /
          </li>
          <li aria-current="page" className="text-text">
            Servers
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">MCP Server Directory</h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
          Browse {count}+ MCP servers and install them into 19 AI applications with a single
          command.
        </p>
      </div>

      {/* Search + server listing */}
      <SearchBar servers={minimalServers} categories={categories} />
    </div>
  );
}
