import type { Metadata } from "next";
import { getAllServers, getCategories, getServerCount } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { SearchBar } from "@/components/SearchBar";
import { AnimatedCommand } from "@/components/AnimatedCommand";
import { AsciiArt } from "@/components/AsciiArt";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const servers = getAllServers();
  const categories = getCategories();
  const count = getServerCount();
  const appCount = getAppIds().length;

  const minimalServers = servers.map((s) => ({
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
      "@type": "WebSite",
      name: "getmcp",
      url: "https://getmcp.es",
      description: `Browse, discover, and install MCP servers into ${appCount} AI applications. One config, every app.`,
      potentialAction: {
        "@type": "SearchAction",
        target: "https://getmcp.es/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "getmcp",
      url: "https://getmcp.es",
      logo: "https://getmcp.es/icon.svg",
      sameAs: ["https://github.com/RodrigoTomeES/getmcp"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "getmcp",
      url: "https://getmcp.es",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      description: `Universal MCP server installer supporting ${appCount} AI applications and 4 config formats.`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero section — two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 mb-16 pt-4 md:pt-10 relative">
        <h1 className="absolute hidden">getmcp</h1>

        {/* Subtle radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 max-w-4/5 w-200 h-125 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Left column: ASCII brand + tagline */}
        <AsciiArt />

        {/* Right column: description + animated CLI */}
        <div className="relative flex flex-col justify-center text-center lg:text-left">
          <p className="text-text-secondary text-xl sm:text-2xl lg:text-3xl leading-tight tracking-tight text-balance mb-8">
            Browse <span className="text-text font-medium">{count} MCP servers</span> and install
            them into <span className="text-text font-medium">{appCount} AI applications</span> with
            a single command.
          </p>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
              Try it now
            </p>
            <AnimatedCommand />
          </div>
        </div>
      </div>

      {/* Separator */}
      <hr className="border-border mb-10" />

      {/* Search + server listing */}
      <SearchBar servers={minimalServers} categories={categories} />
    </div>
  );
}
