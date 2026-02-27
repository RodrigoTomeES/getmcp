import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getServersByCategory } from "@getmcp/registry";
import { ServerCard, type ServerCardData } from "@/components/ServerCard";
import { SITE_URL } from "@/lib/constants";

export const dynamicParams = false;

const CATEGORY_NAMES: Record<string, string> = {
  "developer-tools": "Developer Tools",
  web: "Web",
  automation: "Automation",
  data: "Data",
  search: "Search",
  ai: "AI",
  cloud: "Cloud",
  communication: "Communication",
  design: "Design",
  documentation: "Documentation",
  devops: "DevOps",
  utilities: "Utilities",
  security: "Security",
  gaming: "Gaming",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "developer-tools":
    "MCP servers for code editing, debugging, version control, and development workflows. Integrate GitHub, GitLab, and other dev platforms into your AI assistant.",
  web: "MCP servers for web scraping, browser automation, API integration, and web development. Connect Playwright, Puppeteer, and web APIs to your AI apps.",
  automation:
    "MCP servers for workflow automation, task scheduling, and process orchestration. Automate repetitive tasks across your AI-powered tools.",
  data: "MCP servers for databases, data analysis, and data transformation. Connect PostgreSQL, MongoDB, BigQuery, and other data sources to your AI assistant.",
  search:
    "MCP servers for web search, knowledge retrieval, and information discovery. Integrate Brave Search, Google, and specialized search engines.",
  ai: "MCP servers that extend AI capabilities with additional models, embeddings, and AI-powered services. Connect OpenAI, Anthropic, and other AI providers.",
  cloud:
    "MCP servers for cloud infrastructure, deployment, and cloud service management. Integrate AWS, GCP, Azure, and other cloud platforms.",
  communication:
    "MCP servers for messaging, email, and team collaboration. Connect Slack, Discord, email services, and other communication platforms.",
  design:
    "MCP servers for design tools, image generation, and creative workflows. Integrate Figma, image APIs, and design-related services.",
  documentation:
    "MCP servers for documentation, knowledge bases, and content management. Connect Notion, Confluence, and other documentation platforms.",
  devops:
    "MCP servers for CI/CD, monitoring, container orchestration, and infrastructure management. Integrate Docker, Kubernetes, and deployment pipelines.",
  utilities:
    "MCP servers for file management, system tools, and general-purpose utilities. Manage files, interact with the filesystem, and perform common operations.",
  security:
    "MCP servers for security scanning, vulnerability assessment, and compliance. Integrate security tools and services into your AI workflow.",
  gaming:
    "MCP servers for game development, game data, and gaming platform integration. Connect game APIs and services to your AI assistant.",
};

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
    author: s.author,
    isRemote: "url" in s.config,
    envCount: s.requiredEnvVars.length,
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${name} MCP Servers`,
      description,
      url: `${SITE_URL}/category/${slug}`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/category/${slug}`,
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
        url: `${SITE_URL}/servers/${s.id}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Servers", item: `${SITE_URL}/servers` },
        {
          "@type": "ListItem",
          position: 3,
          name,
          item: `${SITE_URL}/category/${slug}`,
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
