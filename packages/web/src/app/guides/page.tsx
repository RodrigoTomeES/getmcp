import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, GUIDE_SLUGS } from "@/lib/guide-data";

export const metadata: Metadata = {
  title: "MCP Setup Guides — Install Servers in 19 AI Apps",
  description:
    "Step-by-step guides to install and configure MCP servers in Claude Desktop, VS Code, Cursor, Windsurf, and 15 more AI applications. Covers config format, file location, and troubleshooting.",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "MCP Setup Guides — getmcp",
    description: "Step-by-step guides to install and configure MCP servers in 19 AI applications.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Setup Guides — getmcp",
    description: "Step-by-step guides to install and configure MCP servers in 19 AI applications.",
  },
};

export default function GuidesPage() {
  const guides = GUIDE_SLUGS.map((slug) => GUIDES[slug]).filter(Boolean);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "MCP Setup Guides",
      description: `Step-by-step guides to install and configure MCP servers in ${guides.length} AI applications.`,
      url: "https://getmcp.es/guides",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://getmcp.es/guides",
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
          name: "Guides",
          item: "https://getmcp.es/guides",
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
        <span className="text-text">Guides</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">MCP Setup Guides</h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
          Step-by-step guides to install and configure MCP servers in {guides.length} AI
          applications. Each guide covers the config format, file location, quick install, and
          troubleshooting.
        </p>
      </div>

      {/* Guide grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group flex flex-col rounded-lg border border-border bg-surface p-5 hover:bg-surface-hover hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-semibold text-sm group-hover:text-accent transition-colors">
                {guide.name}
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary font-mono uppercase">
                {guide.format}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
              {guide.overview.split(".").slice(0, 2).join(".")}.
            </p>
            <div className="mt-auto">
              <p className="text-[11px] text-text-secondary/60 font-mono truncate">
                {guide.configPaths.project ??
                  guide.configPaths.macos ??
                  guide.configPaths.windows ??
                  "—"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
