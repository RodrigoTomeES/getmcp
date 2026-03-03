> **Note:** This report was generated on 2026-02-26 and may be outdated. The codebase has evolved since this analysis was written. Cross-reference with actual source files for current state.

# getmcp.es — Comprehensive Analysis Report

**URL:** https://getmcp.es
**Date:** 2026-02-26
**Type:** Developer Tool / SaaS Directory
**Framework:** Next.js (React)
**Status:** Beta

---

## 1. Executive Summary

getmcp is a universal MCP (Model Context Protocol) server directory and CLI tool that solves the fragmentation problem across 19 AI applications. Each app (Claude Desktop, VS Code, Cursor, Goose, Codex, etc.) uses a different config format (JSON, JSONC, YAML, TOML) — getmcp provides "one canonical format, every AI app." The site acts as both a **browsable directory** (106 servers across 14 categories) and a **CLI hub** (`npx @getmcp/cli`).

### Key Strengths

- **Unique value proposition**: Only tool supporting 4 config formats (JSON/JSONC/YAML/TOML) across 19 apps with multi-app install
- **Library-first architecture**: npm packages (@getmcp/core, @getmcp/generators, @getmcp/registry, @getmcp/cli)
- **Offline/local-first**: No cloud proxy dependency — configs written once, no runtime overhead
- **Strong technical foundation**: TypeScript monorepo, Zod validation, 586+ tests, MIT license
- **Per-server structured data**: JSON-LD SoftwareApplication schema on every server page

### Key Weaknesses

- **Near-zero search visibility**: `site:getmcp.es` returns 0 results — site is not indexed by Google
- **Thin content**: Server pages are template-driven with minimal unique content (~100-150 words each)
- **No blog or educational content**: Missing the entire "how-to" funnel that competitors own
- **Small registry**: 106 servers vs. Smithery's 7,300+ and PulseMCP's 8,600+
- **Early stage**: 6 GitHub stars, no apparent backlink profile

---

## 2. Site Architecture & Technical Analysis

### 2.1 Page Structure

| Page Type    | Count   | URL Pattern       | Priority |
| ------------ | ------- | ----------------- | -------- |
| Homepage     | 1       | `/`               | 1.0      |
| Docs         | 1       | `/docs`           | 0.9      |
| Server pages | 165     | `/servers/{slug}` | 0.8      |
| **Total**    | **167** |                   |          |

### 2.2 Technology Stack

- **Framework**: Next.js (React) with server-side rendering
- **Font**: Fira Mono (monospace — dev-tool aesthetic)
- **Theme**: Dark mode only (`colorScheme: "dark"`, `#0a0a0a` background)
- **Analytics**: Vercel SpeedInsights integrated
- **Hosting**: Likely Vercel (Next.js + SpeedInsights pattern)
- **Language**: TypeScript (94.7%), Shell (3%), JavaScript (1.9%), CSS (0.4%)
- **Build**: npm workspaces monorepo
- **Testing**: Vitest (586+ tests)
- **Linting**: OxLint + OxFmt

### 2.3 Technical SEO Audit

| Element           | Status      | Notes                                                                                                  |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `robots.txt`      | ✅ Present  | `Allow: /` with sitemap reference                                                                      |
| `sitemap.xml`     | ✅ Present  | 167 URLs, auto-generated, current lastmod                                                              |
| Canonical tags    | ✅ Present  | Self-referencing on homepage                                                                           |
| Meta title        | ⚠️ Weak     | "getmcp — Universal MCP Server Directory" (42 chars, no action keyword)                                |
| Meta description  | ✅ Good     | "Browse, discover, and install MCP servers into any AI application. One config, every app." (90 chars) |
| Open Graph        | ✅ Complete | og:title, og:description, og:image (1200x630), og:locale                                               |
| Twitter Card      | ✅ Complete | summary_large_image with all fields                                                                    |
| JSON-LD (home)    | ⚠️ Minimal  | WebSite schema only — missing Organization, SoftwareApplication                                        |
| JSON-LD (servers) | ✅ Good     | SoftwareApplication with author, description, repository                                               |
| Heading hierarchy | ✅ Correct  | Proper H1 → H2 structure                                                                               |
| Skip-to-content   | ✅ Present  | Accessibility link included                                                                            |
| Mobile responsive | ✅ Yes      | Responsive grid layout                                                                                 |
| HTTPS             | ✅ Yes      | Valid certificate                                                                                      |
| `theme-color`     | ✅ Set      | `#0a0a0a`                                                                                              |

### 2.4 Performance Notes

- Next.js automatic code-splitting with React Suspense boundaries
- Lazy loading via Suspense (server cards show pulse animation while loading)
- Minimal image assets (only `/icon.svg` 32x32)
- No heavy media (no videos, background images, or custom fonts beyond Fira Mono)
- **Expected excellent Core Web Vitals** given minimal assets and SSR

---

## 3. Content Analysis

### 3.1 Homepage

- **Hero**: ASCII art logo + tagline "One config format, every AI app."
- **CTA**: Terminal command display (`$ npx @getmcp/cli`) with "Try it now"
- **Stats badge**: "106 MCP servers" + "19 AI applications"
- **Server grid**: 3-column responsive grid with all 106 servers
- **Category filters**: 14 tags (ai, automation, cloud, communication, data, design, developer-tools, devops, documentation, gaming, search, security, utilities, web)
- **Search**: Text search bar for filtering servers

**Content gap**: No explanatory content about what MCP is, why config fragmentation matters, or how getmcp solves it. Assumes visitor already understands MCP.

### 3.2 Documentation Page (`/docs`)

Comprehensive single-page docs covering:

- Problem statement (config fragmentation)
- CLI commands (add, list, find, remove, sync, check, update, doctor, import)
- Project manifests (`getmcp.json`)
- Supported applications table (19 apps × format)
- Library usage (generators, validation, registry search)
- Contributing (registry entry JSON schema)
- Security disclaimer

**Content gap**: No per-app setup guides, no tutorials, no troubleshooting, no FAQ.

### 3.3 Server Pages (`/servers/{slug}`)

Template-driven with:

- Server name, description (1-2 sentences)
- Metadata: author, runtime, package, transport, tags
- Install command: `npx @getmcp/cli add {server}`
- Config examples for all 19 supported apps (tabbed interface)
- Required environment variables (with warning banner)
- JSON-LD SoftwareApplication schema

**Content gap**: No use cases, no feature details, no comparison to alternatives, no code examples beyond config snippets, no user reviews/ratings, no download stats, no related servers.

---

## 4. Competitive Landscape

### 4.1 Direct Competitors

| Feature               | getmcp                   | Smithery      | mcpm.sh       | mcp-get      | PulseMCP             |
| --------------------- | ------------------------ | ------------- | ------------- | ------------ | -------------------- |
| **Server count**      | 106                      | 7,300+        | 379           | ~200         | 8,600+               |
| **Supported apps**    | 19                       | 19            | 14            | ~5           | N/A (directory)      |
| **Config formats**    | 4 (JSON/JSONC/YAML/TOML) | 1 (JSON)      | 1 (JSON)      | 1 (JSON)     | N/A                  |
| **CLI tool**          | ✅ `npx @getmcp/cli`     | ✅ `smithery` | ✅ `mcpm`     | ✅ `mcp-get` | ❌                   |
| **Offline support**   | ✅                       | ❌ (cloud)    | Partial       | ✅           | N/A                  |
| **Multi-app install** | ✅                       | ❌            | ❌            | ❌           | N/A                  |
| **Project manifests** | ✅ `getmcp.json`         | ❌            | ✅ (profiles) | ❌           | N/A                  |
| **Blog/content**      | ❌                       | ✅            | ❌            | ❌           | ✅ Weekly newsletter |
| **OAuth/Auth**        | ❌                       | ✅            | ❌            | ❌           | N/A                  |
| **Router/proxy**      | ❌                       | ✅ (cloud)    | ✅ (local)    | ❌           | N/A                  |
| **Search visibility** | 🔴 None                  | 🟢 Strong     | 🟡 Medium     | 🟡 Medium    | 🟢 Strong            |

### 4.2 Indirect Competitors

- **Official MCP Registry** (`registry.modelcontextprotocol.io`): The source-of-truth registry with namespace authentication. All directories are effectively downstream aggregators.
- **mcp.so**: Open-source MCP directory
- **mcpservers.org**: Community-curated "Awesome MCP Servers" list
- **aiagentslist.com**: Broader AI agent listing with 593+ MCP servers
- **apitracker.io**: API-focused directory with MCP section

### 4.3 Market Context

- MCP adoption grew 232% from Aug 2025 to Feb 2026 (425 → 1,412 servers)
- 97M+ monthly SDK downloads
- Backed by Anthropic, OpenAI, Google, and Microsoft
- 2026 predicted as "the year for enterprise-ready MCP adoption"
- Market projected at $10.3B by 2026 (34.6% CAGR)

### 4.4 Competitive Advantage

getmcp's unique moat is **multi-format, multi-app configuration generation**. No other tool supports 4 config formats across 19 apps with a single CLI command. This is genuinely valuable for teams using diverse tooling. However, this advantage is purely functional — the website doesn't effectively communicate or market it.

---

## 5. SEO & Organic Growth Analysis

### 5.1 Current Search Visibility

- **Google index**: 0 pages detected via `site:getmcp.es` query
- **Likely cause**: Site is very new, `.es` TLD may delay indexing, minimal backlink profile
- **GitHub presence**: 6 stars (minimal social proof)
- **npm presence**: `@getmcp/cli` package exists but not prominent in search results

### 5.2 Keyword Opportunities

#### High-Value Head Terms

| Keyword                  | Search Intent              | Competition | Opportunity                  |
| ------------------------ | -------------------------- | ----------- | ---------------------------- |
| "MCP servers"            | Informational/Navigational | High        | Medium (need authority)      |
| "MCP server directory"   | Navigational               | Medium      | High                         |
| "install MCP server"     | Transactional              | Medium      | High (matches core product)  |
| "MCP server list"        | Informational              | Medium      | High                         |
| "Model Context Protocol" | Informational              | High        | Low (official docs dominate) |

#### Long-Tail Opportunities (Low Competition, High Intent)

| Keyword Cluster    | Example Queries                                                          | Current Coverage             |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| App-specific setup | "MCP server Cursor setup", "VS Code MCP config", "Goose MCP YAML"        | ❌ No dedicated pages        |
| Server-specific    | "GitHub MCP server install", "Playwright MCP server", "Slack MCP server" | ⚠️ Thin pages exist          |
| Use-case           | "MCP server for database", "MCP server for browser automation"           | ❌ No category landing pages |
| Comparison         | "Smithery vs mcpm", "best MCP server manager", "MCP CLI tools compared"  | ❌ No comparison content     |
| Tutorial           | "how to install MCP server Claude Desktop", "MCP getmcp.json manifest"   | ❌ No tutorial content       |
| Problem-solving    | "MCP config format different apps", "sync MCP servers across editors"    | ❌ Not addressed             |

### 5.3 Content Strategy Recommendations

#### Priority 1: Get Indexed

1. **Submit to Google Search Console** — Verify ownership, submit sitemap
2. **Build initial backlinks** — Submit to MCP directories (PulseMCP, mcp.so, mcpservers.org), dev communities (DEV.to, Hacker News, Reddit r/artificial)
3. **Ensure SSR content is crawlable** — Verify Next.js renders full HTML for Googlebot (not client-side only)

#### Priority 2: Content Depth (Server Pages)

Each of the 165 server pages should expand from ~100 words to ~500-800 words:

- **What it does** (3-4 sentences, not 1)
- **Key features** (bullet list)
- **Common use cases** (2-3 scenarios)
- **Getting started** (step-by-step, not just config dump)
- **Troubleshooting** (common issues)
- **Related servers** (internal linking)

#### Priority 3: New Content Types

| Content Type                          | SEO Value                                    | Example                                     |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| **App setup guides** (19 pages)       | High — captures "[App] MCP setup" queries    | "How to Set Up MCP Servers in Cursor"       |
| **Category landing pages** (14 pages) | High — captures "MCP servers for [category]" | "Best MCP Servers for Database Integration" |
| **Comparison pages**                  | High — captures "X vs Y" queries             | "getmcp vs Smithery: Which MCP Manager?"    |
| **Blog/tutorials**                    | Medium — captures how-to queries             | "Managing MCP Servers Across 5 AI Editors"  |
| **Use case pages**                    | Medium — captures intent-driven queries      | "Automate Browser Testing with MCP"         |
| **FAQ page**                          | Medium — captures question queries           | "What is MCP? How does getmcp work?"        |

#### Priority 4: Technical SEO Improvements

1. **Title tag optimization**: "getmcp — Install MCP Servers Across 19 AI Apps | Universal Config"
2. **Server page titles**: "{Server Name} MCP Server — Install & Configure | getmcp" (currently just "{Server} — getmcp")
3. **Homepage JSON-LD**: Add Organization + SoftwareApplication schemas
4. **Internal linking**: Add "Related servers" to each server page, cross-link category pages
5. **Breadcrumbs**: Already present — add BreadcrumbList JSON-LD schema
6. **Hreflang**: Consider if targeting Spanish market (`.es` TLD) vs international

---

## 6. UX & Design Analysis

### 6.1 Visual Design

- **Aesthetic**: Developer-focused, terminal-inspired dark theme
- **Typography**: Fira Mono throughout (monospace creates "code tool" feel)
- **Color palette**: Near-black background (`#0a0a0a`) with subtle blue gradient accents (`rgba(59,130,246,0.06)`)
- **Effective for target audience**: Developers immediately recognize this as a dev tool

### 6.2 Information Architecture

```
Homepage
├── Search + Category Filters
├── Server Grid (106 cards)
├── /docs (single long-form page)
└── /servers/{slug} (165 individual pages)
```

**Issues**:

- No `/servers` index page (returns 404) — homepage IS the server browser
- No category landing pages (`/servers/category/cloud` etc.)
- Docs is a single monolithic page — should be multi-page for SEO

### 6.3 User Flows

| User Intent                | Current Path                          | Friction                                        |
| -------------------------- | ------------------------------------- | ----------------------------------------------- |
| Browse servers             | Homepage → filter/search → click card | ✅ Low friction                                 |
| Install a server           | Server page → copy CLI command        | ✅ Low friction                                 |
| Configure for specific app | Server page → scroll through 19 tabs  | ⚠️ Many tabs, could default to detected/popular |
| Learn about MCP            | Homepage → ???                        | 🔴 No onboarding content                        |
| Compare tools              | Homepage → ???                        | 🔴 No comparison available                      |
| Team setup                 | Docs → Project Manifests section      | ⚠️ Buried in long docs page                     |

### 6.4 Mobile Experience

- Responsive grid collapses from 3-column to 1-column
- Search and filters accessible
- Config tab interface may be cramped on small screens (19 tabs)

---

## 7. Structured Data & Rich Results

### 7.1 Current Schema Implementation

| Page         | Schema Type         | Quality                                            |
| ------------ | ------------------- | -------------------------------------------------- |
| Homepage     | WebSite             | ⚠️ Minimal (name, url, description only)           |
| Server pages | SoftwareApplication | ✅ Good (name, description, author, category, url) |

### 7.2 Rich Result Opportunities

| Schema Type                        | Opportunity                                                   | Impact                      |
| ---------------------------------- | ------------------------------------------------------------- | --------------------------- |
| **SoftwareApplication** (enhanced) | Add `offers` (free), `operatingSystem`, `applicationCategory` | Medium                      |
| **FAQPage**                        | Add FAQ sections to server pages or docs                      | High — FAQ rich results     |
| **HowTo**                          | Step-by-step installation guides                              | High — HowTo rich results   |
| **BreadcrumbList**                 | Already has visual breadcrumbs — add schema                   | Medium — breadcrumb display |
| **Organization**                   | Homepage — establish brand entity                             | Medium                      |
| **WebApplication**                 | Homepage — describe getmcp itself                             | Medium                      |
| **ItemList**                       | Category pages — list of servers                              | Medium — carousel potential |

---

## 8. Recommendations — Prioritized Roadmap

### Phase 1: Foundation (Weeks 1-2)

1. **Submit to Google Search Console** — Verify and submit sitemap
2. **Fix /servers 404** — Create a proper servers index page
3. **Optimize title tags** — Add "MCP Server" keyword to all server page titles
4. **Add BreadcrumbList schema** to all pages
5. **Enhance homepage JSON-LD** — Add Organization + WebApplication
6. **Build 5-10 initial backlinks** — Submit to MCP directories, post on DEV.to

### Phase 2: Content (Weeks 3-6)

1. **Create 19 app-specific setup guides** (`/guides/claude-desktop`, `/guides/cursor`, etc.)
2. **Create 14 category landing pages** (`/category/cloud`, `/category/database`, etc.)
3. **Expand server pages** — Add use cases, features, related servers to top 20 servers
4. **Split docs into multi-page** — Installation, Configuration, CLI Reference, Library API, Contributing
5. **Add FAQ schema** to expanded server pages

### Phase 3: Growth (Weeks 7-12)

1. **Launch blog** — "How to manage MCP servers across editors", "getmcp vs Smithery", etc.
2. **Create comparison pages** — vs Smithery, vs mcpm.sh, vs mcp-get
3. **Add server ratings/reviews** — User-generated content for SEO
4. **Grow registry** — 106 → 300+ servers (match competitive minimum)
5. **Community building** — Discord server, GitHub discussions, contributor program

### Phase 4: Authority (Ongoing)

1. **Weekly content** — Blog posts targeting long-tail MCP keywords
2. **Integration partnerships** — Get listed in official app documentation
3. **Conference/community presence** — Sponsor MCP ecosystem events
4. **Official registry integration** — Sync with `registry.modelcontextprotocol.io`

---

## 9. SWOT Summary

|              | Positive                                                                                                                                                              | Negative                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Internal** | **Strengths**: Unique multi-format support, 19 apps, offline-first, clean DX, strong TypeScript codebase, MIT license                                                 | **Weaknesses**: Tiny registry (106 vs 8,600+), zero search visibility, no content marketing, single developer, beta stage                                                                              |
| **External** | **Opportunities**: MCP market growing 232% annually, enterprise adoption wave in 2026, no dominant "npm for MCP" yet, `.es` TLD could capture Spanish-speaking market | **Threats**: Smithery has 7,300+ servers + VC backing, official MCP Registry launched, Anthropic Desktop Extensions may reduce need for CLI tools, mcp-get.com already has "mcp-get" brand recognition |

---

## 10. Key Metrics to Track

| Metric                      | Current | Target (3 months) | Target (6 months) |
| --------------------------- | ------- | ----------------- | ----------------- |
| Google indexed pages        | 0       | 100+              | 200+              |
| Organic monthly visits      | ~0      | 500               | 5,000             |
| Registry servers            | 106     | 200               | 400               |
| GitHub stars                | 6       | 50                | 200               |
| npm weekly downloads        | Unknown | 500               | 2,000             |
| Referring domains           | ~0      | 20                | 50                |
| Server page avg. word count | ~100    | 500               | 800               |

---

_Report generated by WebScrapping Analysis Framework — 2026-02-26_
