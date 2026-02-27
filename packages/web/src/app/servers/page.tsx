import type { Metadata } from "next";
import Link from "next/link";
import { getAllServers, getCategories, getServerCount } from "@getmcp/registry";
import { SearchBar } from "@/components/SearchBar";

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
  const count = getServerCount();

  const minimalServers = servers.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    categories: s.categories,
    runtime: s.runtime,
    isRemote: "url" in s.config,
    envCount: s.requiredEnvVars.length,
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "MCP Server Directory",
      description: `Browse and install ${count}+ MCP servers for 19 AI applications.`,
      url: "https://getmcp.es/servers",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://getmcp.es/servers",
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
        <span className="text-text">Servers</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">MCP Server Directory</h1>
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
