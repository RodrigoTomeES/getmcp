import type { Metadata } from "next";
import Link from "next/link";
import { getServerCount } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { AnimatedCommand } from "@/components/AnimatedCommand";
import { AsciiArt } from "@/components/AsciiArt";
import { FormatShowcase } from "@/components/FormatShowcase";
import { PopularServers } from "@/components/PopularServers";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SupportedApps } from "@/components/SupportedApps";

export const metadata: Metadata = {
  title: "Install MCP Servers in 19 AI Apps with One Command",
  description:
    "Install and configure MCP servers across Claude Desktop, VS Code, Cursor, Windsurf, and 15 more AI apps. Universal config generator for JSON, JSONC, YAML, and TOML formats.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const count = getServerCount();
  const appCount = getAppIds().length;

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
            background: "radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Left column: ASCII brand + tagline */}
        <AsciiArt />

        {/* Right column: description + animated CLI */}
        <div className="relative flex flex-col justify-center text-center lg:text-left">
          <p className="text-text-secondary text-xl sm:text-2xl lg:text-3xl leading-tight tracking-tight text-balance mb-8">
            Install MCP servers into{" "}
            <span className="text-text font-medium">{appCount} AI applications</span> with a single
            command. Browse our registry of{" "}
            <span className="text-text font-medium">{count}+ servers</span> with configs for JSON,
            JSONC, YAML, and TOML.
          </p>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
              Install via CLI
            </p>
            <AnimatedCommand />
          </div>
        </div>
      </div>

      {/* Separator */}
      <hr className="border-border mb-10" />

      {/* What is MCP? */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-3">What is MCP?</h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl mb-6">
          The{" "}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Model Context Protocol
          </a>{" "}
          (MCP) lets AI assistants connect to external tools and data sources. The problem? Every AI
          app uses a different config format — different root keys, field names, and file formats.
          getmcp solves this: define your servers once, and we generate the correct config for all{" "}
          {appCount} supported apps automatically.
        </p>
        <FormatShowcase />
      </section>

      <hr className="border-border my-12" />

      {/* Popular Servers */}
      <section className="mb-12">
        <PopularServers />
      </section>

      <hr className="border-border my-12" />

      {/* Browse by Category */}
      <section className="mb-12">
        <CategoryGrid />
      </section>

      <hr className="border-border my-12" />

      {/* Supported Apps */}
      <section className="mb-12">
        <SupportedApps />
      </section>

      {/* Final CTA */}
      <div className="text-center py-10 border-t border-border">
        <p className="text-text-secondary mb-4">
          {count}+ servers ready to install across {appCount} AI apps.
        </p>
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
        >
          Get started with a setup guide &rarr;
        </Link>
      </div>
    </div>
  );
}
