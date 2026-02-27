# getmcp.es — Structured Metadata Specification

**URL:** https://getmcp.es
**Date:** 2026-02-26
**Specialist:** Structured Metadata Analyst

---

## 1. Executive Summary

getmcp.es has a **reasonable but incomplete** structured data implementation. Server pages include `SoftwareApplication` JSON-LD (good), but are missing critical properties (`offers`, correct `author @type`) that prevent rich result eligibility. The homepage has a minimal `WebSite` schema with no `Organization`, `WebApplication`, or `ItemList`. The `/docs` page has no structured data at all.

**Current state:** Schema exists but won't trigger any Google rich results.
**Target state:** Full rich result eligibility + AI search engine optimization.

---

## 2. Current Implementation Audit

### 2.1 Homepage (`/`)

**JSON-LD found:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "getmcp",
  "url": "https://getmcp.es",
  "description": "Browse, discover, and install MCP servers into any AI application."
}
```

**Meta tags found:**
| Tag | Value | Status |
|-----|-------|--------|
| `<title>` | "getmcp — Universal MCP Server Directory" | ⚠️ Missing action keyword |
| `meta description` | "Browse, discover, and install MCP servers..." | ✅ Good (90 chars) |
| `meta keywords` | "MCP, Model Context Protocol, AI tools, Claude Desktop, VS Code, MCP servers, config generator" | ⚠️ Same on every page |
| `canonical` | `https://getmcp.es` | ✅ Present |
| `theme-color` | `#0a0a0a` | ✅ Present |

**Open Graph:**
| Tag | Value | Status |
|-----|-------|--------|
| `og:title` | "getmcp — Universal MCP Server Directory" | ✅ Present |
| `og:description` | Matches meta description | ✅ Present |
| `og:type` | `website` | ✅ Correct |
| `og:image` | `/opengraph-image?bf8fde7b...` (1200x630 PNG) | ✅ Dynamic |
| `og:locale` | `en_US` | ✅ Present |
| `og:site_name` | `getmcp` | ✅ Present |

**Twitter Card:**
| Tag | Value | Status |
|-----|-------|--------|
| `twitter:card` | `summary_large_image` | ✅ Correct |
| `twitter:title` | Matches og:title | ✅ Present |
| `twitter:image` | Matches og:image | ✅ Present |
| `twitter:site` | Not present | ❌ Missing |
| `twitter:creator` | Not present | ❌ Missing |

**Gaps:**

- ❌ No `Organization` schema
- ❌ No `WebApplication` schema (for getmcp itself as a tool)
- ❌ No `ItemList` for the 106 server cards
- ❌ No `SearchAction` (deprecated for Sitelinks, but useful for AI crawlers)
- ❌ No `twitter:site` handle

### 2.2 Server Pages (`/servers/{slug}`)

**JSON-LD found (consistent template across all pages):**

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "GitHub",
  "description": "GitHub's official MCP server...",
  "applicationCategory": "DeveloperApplication",
  "author": {
    "@type": "Person",
    "name": "GitHub"
  },
  "url": "https://github.com/github/github-mcp-server"
}
```

**Gaps:**
| Issue | Severity | Details |
|-------|----------|---------|
| ❌ Missing `offers` | **CRITICAL** | Google requires `offers.price` for SoftwareApplication rich results. Even free software needs `"price": "0"` |
| ❌ `author @type` wrong | HIGH | GitHub, Microsoft, Anthropic are `Organization`, not `Person` |
| ❌ `url` points to GitHub | HIGH | Should point to getmcp.es canonical URL. Use `downloadUrl` for external repo |
| ❌ No `mainEntityOfPage` | MEDIUM | Doesn't declare the getmcp page as the primary entity |
| ❌ No `BreadcrumbList` | MEDIUM | Visual breadcrumbs exist but no schema markup |
| ❌ No `operatingSystem` | LOW | Could specify based on runtime |
| ❌ No `softwareRequirements` | LOW | Could specify Node.js, Docker, etc. |
| ❌ No `softwareVersion` | LOW | Could pull from registry |
| ❌ No `isAccessibleForFree` | LOW | All servers are free/open-source |
| ❌ No `downloadUrl` | LOW | Should point to npm/GitHub |
| ❌ No `image` | LOW | No server icon/logo referenced |
| ⚠️ `og:type` is `article` | LOW | Should be `website` — `article` implies blog post |
| ⚠️ `og:image:alt` is generic | LOW | "MCP Server Configuration" on all pages — should be per-server |

### 2.3 Documentation Page (`/docs`)

**JSON-LD found:** NONE

**Meta tags:** Standard title + description present.

**Gap:** No `TechArticle` or any structured data. This is a documentation page that should at minimum have a `TechArticle` schema.

---

## 3. Rich Result Eligibility Status

| Rich Result Type                 | Eligible?  | Blocking Issue                                                                 | Fix Effort                            |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| **SoftwareApplication**          | ❌ No      | Missing `offers.price` + `aggregateRating` or `review`                         | Low (add offers) / High (add ratings) |
| **BreadcrumbList**               | ❌ No      | Schema not implemented (visual breadcrumbs exist)                              | Low                                   |
| **Organization Knowledge Panel** | ❌ No      | No Organization schema on homepage                                             | Low                                   |
| **Sitelinks Search Box**         | N/A        | Deprecated by Google (Nov 2024)                                                | —                                     |
| **FAQPage**                      | N/A        | Deprecated for rich results (Aug 2023). Useful for AI.                         | —                                     |
| **HowTo**                        | N/A        | Fully deprecated (Sep 2023)                                                    | —                                     |
| **Carousels (Beta)**             | 🟡 Partial | ItemList with SoftwareApplication not yet supported. Available in EEA (Spain). | Medium                                |

### 3.1 Path to SoftwareApplication Rich Results

Google requires ALL of:

1. ✅ `name` — present
2. ❌ `offers.price` — **MISSING** (even free = `"price": "0"`)
3. ❌ `aggregateRating` OR `review` — **MISSING**

**Minimum viable fix:** Add `offers` block. This is necessary but not sufficient — Google also requires either `aggregateRating` or `review`.

**Full eligibility requires a rating/review system.** Options:

- Use GitHub stars as a proxy metric (ethical gray area — must represent actual user ratings on the page)
- Build a simple 1-5 star rating system on server pages
- Show npm download counts as a "popularity" signal (not a direct substitute for `aggregateRating`)

---

## 4. Recommended Schema Architecture

### 4.1 Homepage — WebSite + Organization + CollectionPage + ItemList

```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "getmcp",
    "alternateName": "getmcp.es",
    "url": "https://getmcp.es",
    "description": "Browse, discover, and install MCP servers into any AI application. One config, every app.",
    "inLanguage": "en",
    "publisher": {
      "@type": "Organization",
      "name": "getmcp",
      "url": "https://getmcp.es",
      "logo": {
        "@type": "ImageObject",
        "url": "https://getmcp.es/icon.svg",
        "width": 32,
        "height": 32
      },
      "sameAs": [
        "https://github.com/RodrigoTomeES/getmcp",
        "https://www.npmjs.com/package/@getmcp/cli"
      ]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "getmcp CLI",
    "url": "https://getmcp.es",
    "description": "Universal MCP server installer for 19 AI applications. Supports JSON, JSONC, YAML, and TOML configuration formats.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Windows, macOS, Linux",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "softwareRequirements": "Node.js 18+, npm",
    "isAccessibleForFree": true,
    "license": "https://opensource.org/licenses/MIT",
    "author": {
      "@type": "Person",
      "name": "RodrigoTomeES",
      "url": "https://github.com/RodrigoTomeES"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "MCP Server Directory",
    "description": "Browse 106+ MCP servers installable across 19 AI applications",
    "url": "https://getmcp.es",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": 106,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "GitHub MCP Server",
          "url": "https://getmcp.es/servers/github"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Playwright MCP Server",
          "url": "https://getmcp.es/servers/playwright"
        }
      ]
    }
  }
]
```

**Notes:**

- `ItemList` should include all 106 servers (generated programmatically)
- `WebApplication` describes getmcp itself as a tool
- `Organization` establishes brand identity

### 4.2 Server Pages — SoftwareApplication + BreadcrumbList

```json
[
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "{Server Name} MCP Server",
    "description": "{Server description}",
    "applicationCategory": "DeveloperApplication",
    "applicationSubCategory": "MCP Server",
    "operatingSystem": "{Based on runtime: 'Windows, macOS, Linux'}",
    "softwareRequirements": "{Runtime: 'Node.js 18+' | 'Docker' | 'Python 3.10+'}",
    "isAccessibleForFree": true,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "{Author name}",
      "url": "{Author URL if available}"
    },
    "url": "https://getmcp.es/servers/{slug}",
    "downloadUrl": "{GitHub repo or npm URL}",
    "installUrl": "https://getmcp.es/servers/{slug}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://getmcp.es/servers/{slug}"
    },
    "image": "https://getmcp.es/servers/{slug}/opengraph-image",
    "keywords": ["{Server name}", "MCP", "MCP server", "{...tags}"]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://getmcp.es"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Servers",
        "item": "https://getmcp.es/servers"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "{Server Name}",
        "item": "https://getmcp.es/servers/{slug}"
      }
    ]
  }
]
```

**Template variables** (populated from server registry data):

- `{Server Name}` — from `server.name`
- `{slug}` — from `server.id`
- `{Server description}` — from `server.description`
- `{Author name}` — from `server.author`
- `{Runtime}` — map `server.runtime` to requirements string
- `{...tags}` — from `server.categories`

### 4.3 Documentation Page — TechArticle

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "getmcp Documentation — CLI Commands, Config Formats & API Reference",
  "description": "Complete documentation for getmcp: installation, CLI commands, project manifests, library API, and contributing guide.",
  "url": "https://getmcp.es/docs",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://getmcp.es/docs"
  },
  "author": {
    "@type": "Organization",
    "name": "getmcp"
  },
  "publisher": {
    "@type": "Organization",
    "name": "getmcp",
    "url": "https://getmcp.es"
  },
  "inLanguage": "en",
  "proficiencyLevel": "Beginner",
  "dependencies": "Node.js 18+, npm"
}
```

### 4.4 Category Pages (NEW) — CollectionPage + ItemList

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "MCP Servers for {Category}",
  "description": "Browse and install {Category} MCP servers across 19 AI applications",
  "url": "https://getmcp.es/category/{slug}",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": "{count}",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "{Server 1}",
        "url": "https://getmcp.es/servers/{slug1}"
      }
    ]
  }
}
```

### 4.5 App Guide Pages (NEW) — TechArticle + BreadcrumbList

```json
[
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "How to Install MCP Servers in {App Name}",
    "description": "Step-by-step guide to setting up MCP servers in {App Name} using getmcp. Covers {format} config format at {config_path}.",
    "url": "https://getmcp.es/guides/{app-slug}",
    "author": { "@type": "Organization", "name": "getmcp" },
    "publisher": { "@type": "Organization", "name": "getmcp", "url": "https://getmcp.es" },
    "inLanguage": "en",
    "proficiencyLevel": "Beginner"
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://getmcp.es" },
      { "@type": "ListItem", "position": 2, "name": "Guides", "item": "https://getmcp.es/guides" },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "{App Name}",
        "item": "https://getmcp.es/guides/{app-slug}"
      }
    ]
  }
]
```

---

## 5. Open Graph Specification

### 5.1 Fixes for Current Pages

| Page Type    | Current `og:type` | Correct `og:type` | Notes                          |
| ------------ | ----------------- | ----------------- | ------------------------------ |
| Homepage     | `website`         | `website`         | ✅ Correct                     |
| Server pages | `article`         | `website`         | ❌ Fix — these aren't articles |
| Docs         | `website`         | `website`         | ✅ Correct                     |

### 5.2 Per-Page OG Tag Spec

**Homepage:**

```html
<meta property="og:title" content="getmcp — Install MCP Servers in 19 AI Apps with One Command" />
<meta
  property="og:description"
  content="Universal MCP server directory and CLI. Auto-generate configs for Claude, VS Code, Cursor, Goose, Codex and 14 more. JSON, YAML, TOML supported."
/>
<meta property="og:type" content="website" />
<meta property="og:url" content="https://getmcp.es" />
<meta property="og:site_name" content="getmcp" />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content="https://getmcp.es/opengraph-image" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="getmcp — Universal MCP Server Installer for 19 AI Apps" />
```

**Server pages:**

```html
<meta property="og:title" content="{Name} MCP Server — Install in 19 AI Apps | getmcp" />
<meta property="og:description" content="{Description}. Install with: npx @getmcp/cli add {slug}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://getmcp.es/servers/{slug}" />
<meta property="og:image:alt" content="{Name} MCP Server — Install & Configure" />
```

### 5.3 Dynamic OG Image Enhancements

Current: Generic dynamic images per route.

**Recommended per-server OG image content:**

- Server name (large, prominent)
- Category/tag badge
- "Install in 19 AI Apps" tagline
- getmcp logo/brand
- Dark theme matching site design

**Next.js implementation:** Already using file convention (`opengraph-image.tsx`). Enhance the template to include server-specific data.

### 5.4 Twitter Card Additions

Add to all pages:

```html
<meta name="twitter:site" content="@getmcp" />
<meta name="twitter:creator" content="@RodrigoTomeES" />
```

---

## 6. Meta Tag Specification

### 6.1 Title Tag Patterns

| Page Type        | Pattern                                                                  | Max Length |
| ---------------- | ------------------------------------------------------------------------ | ---------- |
| Homepage         | `getmcp — Install MCP Servers in Claude, VS Code, Cursor & 16 More Apps` | 70 chars   |
| Server pages     | `{Name} MCP Server — Install & Configure for 19 AI Apps \| getmcp`       | 65 chars   |
| Category pages   | `Best MCP Servers for {Category} — Browse & Install \| getmcp`           | 60 chars   |
| App guides       | `How to Install MCP Servers in {App} — Setup Guide \| getmcp`            | 60 chars   |
| Docs pages       | `{Section Title} — getmcp Documentation`                                 | 55 chars   |
| Blog posts       | `{Post Title} \| getmcp Blog`                                            | 60 chars   |
| Comparison pages | `getmcp vs {Competitor}: MCP Server Manager Comparison`                  | 55 chars   |

### 6.2 Meta Description Patterns

| Page Type      | Pattern                                                                                                                                               | Target Length |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Homepage       | "Install MCP servers across Claude Desktop, VS Code, Cursor, and 16 more AI apps with one command. Universal config generator for JSON, YAML & TOML." | 150-155 chars |
| Server pages   | "{Name}: {description_truncated}. Install in 19 AI apps with `npx @getmcp/cli add {slug}`. Auto-generates JSON, YAML, and TOML configs."              | 150-160 chars |
| Category pages | "Browse the best MCP servers for {category}. Install {count} servers into Claude, VS Code, Cursor and more with one command."                         | 130-150 chars |
| App guides     | "Step-by-step guide to setting up MCP servers in {App}. Uses {format} config at {path}. One-command install with getmcp CLI."                         | 130-150 chars |

### 6.3 Per-Page Keywords

Replace the current static `meta keywords` tag with per-page keywords:

| Page Type      | Keywords Pattern                                                                         |
| -------------- | ---------------------------------------------------------------------------------------- |
| Homepage       | "MCP servers, MCP server directory, install MCP server, universal MCP installer, getmcp" |
| Server pages   | "{Name}, {Name} MCP server, install {Name} MCP, {tags joined}, MCP server"               |
| Category pages | "{Category} MCP servers, best {category} MCP servers, MCP for {category}"                |
| App guides     | "{App} MCP setup, {App} MCP server, configure MCP {App}, {App} MCP config"               |

_Note: Google officially ignores `meta keywords`, but other search engines (Bing, Yandex) and AI crawlers may use them as secondary signals._

---

## 7. Next.js Implementation Guide

### 7.1 Server Page Component (`app/servers/[slug]/page.tsx`)

```tsx
import { Metadata } from "next";

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const server = await getServer(params.slug);
  return {
    title: `${server.name} MCP Server — Install & Configure for 19 AI Apps | getmcp`,
    description: `${server.description}. Install in 19 AI apps with npx @getmcp/cli add ${server.id}.`,
    keywords: [server.name, "MCP server", ...server.categories, "getmcp"],
    openGraph: {
      title: `${server.name} MCP Server — Install in 19 AI Apps | getmcp`,
      description: `${server.description}. Install with: npx @getmcp/cli add ${server.id}`,
      type: "website", // NOT 'article'
      siteName: "getmcp",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@getmcp",
      creator: "@RodrigoTomeES",
    },
    alternates: {
      canonical: `https://getmcp.es/servers/${server.id}`,
      languages: { en: `https://getmcp.es/servers/${server.id}` },
    },
  };
}

// JSON-LD injection
export default function ServerPage({ server }) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${server.name} MCP Server`,
      description: server.description,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "MCP Server",
      operatingSystem: runtimeToOS(server.runtime),
      softwareRequirements: runtimeToRequirements(server.runtime),
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: {
        "@type": "Organization", // NOT Person
        name: server.author,
      },
      url: `https://getmcp.es/servers/${server.id}`,
      downloadUrl: server.repository,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://getmcp.es/servers/${server.id}`,
      },
      keywords: [server.name, "MCP", ...server.categories],
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
          name: server.name,
          item: `https://getmcp.es/servers/${server.id}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Page content */}
    </>
  );
}

// Helper functions
function runtimeToOS(runtime: string): string {
  return "Windows, macOS, Linux"; // All MCP servers are cross-platform
}

function runtimeToRequirements(runtime: string): string {
  const map: Record<string, string> = {
    node: "Node.js 18+",
    docker: "Docker",
    python: "Python 3.10+",
    go: "Go 1.21+",
  };
  return map[runtime] || "Node.js 18+";
}
```

### 7.2 Validation Checklist

After implementation, validate every page type with:

| Tool                     | URL                                 | What to Check                                             |
| ------------------------ | ----------------------------------- | --------------------------------------------------------- |
| Google Rich Results Test | search.google.com/test/rich-results | SoftwareApplication eligibility, BreadcrumbList rendering |
| Schema Markup Validator  | validator.schema.org                | All JSON-LD syntax and type correctness                   |
| OpenGraph.xyz            | opengraph.xyz                       | OG image rendering, title/description display             |
| Google Search Console    | search.google.com/search-console    | Structured data errors/warnings after deployment          |

---

## 8. Implementation Priority

| #   | Action                                                          | Impact                          | Effort | Priority |
| --- | --------------------------------------------------------------- | ------------------------------- | ------ | -------- |
| 1   | Add `offers: { price: "0" }` to all SoftwareApplication         | Enables rich result path        | 15 min | **P0**   |
| 2   | Fix `author @type` from Person to Organization                  | Fixes validation errors         | 15 min | **P0**   |
| 3   | Change `url` to getmcp.es canonical, add `downloadUrl` for repo | Correct entity association      | 30 min | **P0**   |
| 4   | Add `mainEntityOfPage` to all server pages                      | Correct page-entity binding     | 15 min | **P0**   |
| 5   | Add BreadcrumbList JSON-LD to all pages                         | Desktop SERP breadcrumbs        | 1h     | **P1**   |
| 6   | Add Organization schema to homepage                             | Brand identity                  | 30 min | **P1**   |
| 7   | Add WebApplication schema to homepage                           | Describe getmcp as a tool       | 30 min | **P1**   |
| 8   | Change server page `og:type` from `article` to `website`        | Correct semantics               | 15 min | **P1**   |
| 9   | Add per-server `og:image:alt` text                              | Accessibility + SEO             | 30 min | **P1**   |
| 10  | Add `twitter:site` and `twitter:creator`                        | Social card completeness        | 15 min | **P1**   |
| 11  | Add ItemList schema to homepage                                 | Semantic + potential carousel   | 2h     | **P2**   |
| 12  | Add TechArticle schema to /docs                                 | Documentation semantics         | 30 min | **P2**   |
| 13  | Add per-page keywords meta tag                                  | Secondary signal for non-Google | 1h     | **P2**   |
| 14  | Add `operatingSystem`, `softwareRequirements`                   | Richer schema data              | 1h     | **P2**   |
| 15  | Build rating/review system for `aggregateRating`                | Full rich result eligibility    | 8-16h  | **P3**   |

**Total P0+P1 effort: ~4 hours.** This should be done in the first week.

---

_Report generated by WebScrapping Analysis Framework — 2026-02-26_
