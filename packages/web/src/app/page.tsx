import type { Metadata } from "next";
import Link from "next/link";
import { getServerCount } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { SITE_URL } from "@/lib/constants";
import { AnimatedCommand } from "@/components/AnimatedCommand";
import { AsciiArt } from "@/components/AsciiArt";
import { StatsBar } from "@/components/StatsBar";
import { FormatShowcase } from "@/components/FormatShowcase";
import { CliShowcase } from "@/components/CliShowcase";
import { PopularServers } from "@/components/PopularServers";
import { TeamFeatures } from "@/components/TeamFeatures";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SecurityFeatures } from "@/components/SecurityFeatures";
import { SupportedApps } from "@/components/SupportedApps";
import { DeveloperExperience } from "@/components/DeveloperExperience";

export const metadata: Metadata = {
  title: "getmcp — Install MCP Servers in Claude, VS Code, Cursor & 16 More Apps",
  description:
    "Install and configure MCP servers across Claude Desktop, VS Code, Cursor, Windsurf, Codex, and 14 more AI apps with one command. Multi-registry support, team manifests, and config generation for JSON, JSONC, YAML, and TOML.",
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
      alternateName: "getmcp.es",
      url: SITE_URL,
      inLanguage: "en",
      description: `Browse, discover, and install MCP servers into ${appCount} AI applications. One config, every app.`,
      publisher: {
        "@type": "Organization",
        name: "getmcp",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon.svg`,
          width: 32,
          height: 32,
        },
        sameAs: [
          "https://github.com/RodrigoTomeES/getmcp",
          "https://www.npmjs.com/package/@getmcp/cli",
        ],
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "getmcp",
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      description: `Universal MCP server installer supporting ${appCount} AI applications and 4 config formats.`,
      featureList: [
        "Install MCP servers across 19 AI apps",
        "Multi-registry support with private registries",
        "Team project manifests (getmcp.json)",
        "Config generation for JSON, JSONC, YAML, and TOML",
        "Lock file for reproducible installs",
        "Auto-detection of installed AI apps",
        "Security hardening with HTTPS enforcement",
      ],
      softwareRequirements: "Node.js >= 22.17, npm",
      isAccessibleForFree: true,
      license: "https://opensource.org/licenses/MIT",
      author: {
        "@type": "Person",
        name: "RodrigoTomeES",
        url: "https://github.com/RodrigoTomeES",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is getmcp?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "getmcp is a universal installer and configuration tool for MCP (Model Context Protocol) servers. It lets you install and configure MCP servers across 19 AI applications — including Claude Desktop, VS Code, Cursor, and Windsurf — with a single command.",
          },
        },
        {
          "@type": "Question",
          name: "Does getmcp support private registries?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. getmcp supports multiple registries including the official MCP registry and private company registries. Authentication via bearer tokens, basic auth, and custom headers is built in.",
          },
        },
        {
          "@type": "Question",
          name: "Is getmcp free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, getmcp is completely free and open source. You can use it via npx without any installation: npx @getmcp/cli add <server>.",
          },
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

      {/* Hero section — two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 mb-16 pt-4 md:pt-10 relative">
        <h1 className="absolute hidden">getmcp — Install MCP Servers Across {appCount} AI Apps</h1>

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
          <p className="text-text-secondary text-xl sm:text-2xl leading-tight tracking-tight text-balance mb-8">
            One command. Every AI app. Install and configure MCP servers across{" "}
            <span className="text-text font-medium">{appCount} applications</span> - from Claude
            Desktop to VS Code to Cursor.{" "}
            <span className="text-text font-medium">{count}+ servers</span> ready, with automatic
            config generation for JSON, JSONC, YAML, and TOML.
          </p>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
              Install via CLI
            </p>
            <AnimatedCommand />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar serverCount={count} appCount={appCount} />

      {/* Separator */}
      <hr className="border-border mb-10" />

      {/* What is MCP? */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-3">What is MCP?</h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl mb-2">
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
        <p className="font-medium text-text mb-6">
          No more copy-pasting from docs. No more format guessing.
        </p>
        <FormatShowcase />
      </section>

      <hr className="border-border my-12" />

      {/* CLI Showcase */}
      <CliShowcase />

      <hr className="border-border my-12" />

      {/* Popular Servers */}
      <section className="mb-12">
        <PopularServers />
      </section>

      <hr className="border-border my-12" />

      {/* Team & Enterprise */}
      <TeamFeatures />

      <hr className="border-border my-12" />

      {/* Browse by Category */}
      <section className="mb-12">
        <CategoryGrid />
      </section>

      <hr className="border-border my-12" />

      {/* Security & Trust */}
      <SecurityFeatures />

      <hr className="border-border my-12" />

      {/* Supported Apps */}
      <section className="mb-12">
        <SupportedApps />
      </section>

      <hr className="border-border my-12" />

      {/* Developer Experience */}
      <DeveloperExperience />

      {/* Final CTA */}
      <div className="text-center py-10 border-t border-border">
        <h2 className="text-2xl font-bold text-text mb-2">Stop configuring. Start building.</h2>
        <p className="text-text-secondary mb-6">
          {count}+ servers. {appCount} AI apps. One command.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
          >
            Get started &rarr;
          </Link>
          <Link
            href="/servers"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:border-text-secondary text-text font-medium transition-colors"
          >
            Browse servers &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
