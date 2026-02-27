# getmcp.es — Improvement Report

**URL:** https://getmcp.es
**Date:** 2026-02-26
**Based on:** ANALYSIS_REPORT.md (same date)

---

## 1. Strategic Positioning Overhaul

### 1.1 Problem: Competing on the Wrong Metric

getmcp advertises "106 MCP servers" on its homepage. Competitors advertise 7,300+ (Smithery) and 8,600+ (PulseMCP). **Leading with server count is a losing strategy.** The product's actual moat — universal multi-format config generation across 19 apps — is buried beneath a metric where getmcp ranks last.

**Improvement:**

| Element        | Current                            | Proposed                                                                                                                          |
| -------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Hero headline  | "One config format, every AI app." | "Install any MCP server into 19 AI apps — with one command."                                                                      |
| Primary stat   | "106 MCP servers"                  | "19 AI apps supported"                                                                                                            |
| Secondary stat | "19 AI applications"               | "4 config formats auto-generated (JSON · JSONC · YAML · TOML)"                                                                    |
| Hero subtext   | None                               | "The only universal MCP installer. One command writes the correct config for Claude, VS Code, Cursor, Goose, Codex, and 14 more." |
| Social proof   | None                               | npm weekly downloads badge + GitHub stars badge + "Used by X teams"                                                               |

### 1.2 Problem: No Onboarding for Non-MCP Users

The homepage assumes every visitor knows what MCP is. The MCP ecosystem is still early — many potential users are searching "what is MCP" or "connect AI to external tools." Without explanatory content, getmcp loses the entire top-of-funnel.

**Improvement:** Add a "What is MCP?" section between the hero and the server grid:

```
## What is MCP?

Model Context Protocol (MCP) is the open standard for connecting AI
assistants to external tools, databases, and APIs. Think of it as
USB-C for AI — one protocol, universal compatibility.

The problem? Every AI app uses a different config format:
- Claude Desktop → JSON with `mcpServers`
- VS Code → JSON with `servers`
- Goose → YAML with `extensions`
- Codex → TOML with `mcp_servers`

getmcp solves this. One command, correct config for every app.
```

### 1.3 Problem: `.es` TLD Signals Spain, Not Global

The `.es` country-code TLD causes Google to geo-target the site to Spain by default. For a developer tool targeting a global English-speaking audience, this is a significant handicap.

**Improvement Options (ranked):**

1. **Acquire `getmcp.com` or `getmcp.dev`** — redirect `.es` to the new domain (best long-term)
2. **Set international targeting in Google Search Console** — override the `.es` geo signal to "International" (quick fix)
3. **Add `hreflang="en"` tags** — signal English as the primary language
4. **Add `<link rel="alternate" hreflang="x-default">` tags** — signal the site is not Spain-specific

---

## 2. SEO Improvements (Critical — Zero Visibility)

### 2.1 Indexation Emergency

getmcp.es has **zero pages indexed** by Google. This is the single most urgent issue. A site that can't be found doesn't exist to potential users.

**Immediate Actions:**

1. **Google Search Console**: Register and verify `getmcp.es`, submit `sitemap.xml`, request indexation of homepage
2. **Bing Webmaster Tools**: Same process — Bing/DuckDuckGo is 5-8% of dev search traffic
3. **Verify SSR output**: Use `curl -A "Googlebot" https://getmcp.es` to confirm full HTML is served (not an empty React shell)
4. **Check for `noindex` tags**: Verify no accidental `<meta name="robots" content="noindex">` on any page
5. **Manual URL inspection**: Use GSC to inspect homepage and 5 key server pages — check for crawl errors

### 2.2 Title Tag Overhaul

Current title tags are generic and miss high-value keywords.

| Page Type            | Current Format                            | Proposed Format                                                          |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------ | ------- |
| Homepage             | "getmcp — Universal MCP Server Directory" | "getmcp — Install MCP Servers in Claude, VS Code, Cursor & 16 More Apps" |
| Docs                 | Unknown (likely "Docs — getmcp")          | "Documentation — CLI Commands, Config Formats & Library API              | getmcp" |
| Server pages         | "{Name} — getmcp"                         | "{Name} MCP Server — Install & Configure for 19 AI Apps                  | getmcp" |
| Category pages (new) | N/A                                       | "Best MCP Servers for {Category} — Browse & Install                      | getmcp" |
| App guides (new)     | N/A                                       | "How to Install MCP Servers in {App} — Step-by-Step Guide                | getmcp" |

### 2.3 Meta Description Optimization

| Page Type    | Current                                                                                                | Proposed                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Homepage     | "Browse, discover, and install MCP servers into any AI application. One config, every app." (90 chars) | "Install MCP servers across Claude Desktop, VS Code, Cursor, and 16 more AI apps with one command. Universal config generator supporting JSON, YAML & TOML." (155 chars) |
| Server pages | Generic per-server description                                                                         | "{Name}: {description}. Install in 19 AI apps with `npx @getmcp/cli add {slug}`. Config auto-generated for Claude, VS Code, Cursor, Goose & more."                       |

### 2.4 Structured Data Enhancements

**Homepage — add these schemas:**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "getmcp",
  "url": "https://getmcp.es",
  "logo": "https://getmcp.es/icon.svg",
  "sameAs": ["https://github.com/RodrigoTomeES/getmcp"]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "getmcp CLI",
  "url": "https://getmcp.es",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Windows, macOS, Linux",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": "Universal MCP server installer for 19 AI applications"
}
```

**All pages — add BreadcrumbList:**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://getmcp.es" },
    { "@type": "ListItem", "position": 2, "name": "Servers", "item": "https://getmcp.es/servers" },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "GitHub",
      "item": "https://getmcp.es/servers/github"
    }
  ]
}
```

**Server pages — enhance existing SoftwareApplication:**

Add `offers` (free), `operatingSystem`, `downloadUrl`, and `softwareRequirements` to existing schema.

### 2.5 Internal Linking Architecture

Current: Flat. Each server page links back to homepage only. No cross-links between related servers.

**Proposed internal link structure:**

```
Homepage
├── /servers (NEW index page — currently 404!)
│   ├── /servers/category/cloud (NEW)
│   ├── /servers/category/database (NEW)
│   ├── /servers/category/developer-tools (NEW)
│   └── ... (14 category pages total)
├── /guides (NEW section)
│   ├── /guides/claude-desktop (NEW)
│   ├── /guides/cursor (NEW)
│   ├── /guides/vscode (NEW)
│   └── ... (19 app guide pages total)
├── /docs
│   ├── /docs/installation (NEW — split from monolith)
│   ├── /docs/cli-reference (NEW)
│   ├── /docs/library-api (NEW)
│   ├── /docs/manifests (NEW)
│   └── /docs/contributing (NEW)
├── /blog (NEW)
└── /compare (NEW)
    ├── /compare/smithery (NEW)
    └── /compare/mcpm (NEW)
```

**Each server page should include:**

- "Related Servers" section → 3-5 servers in the same category (cross-links)
- "Install in..." section → links to relevant app guides
- Breadcrumbs linking up to category → servers index → home

### 2.6 Sitemap Improvements

| Issue                                            | Fix                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| All 167 URLs share identical `lastmod` timestamp | Use per-page `lastmod` based on actual content changes (e.g., when server entry was last updated in registry) |
| No priority differentiation within server pages  | Boost popular servers (GitHub, Playwright, Slack) to 0.9; keep niche servers at 0.7                           |
| No image sitemap                                 | Add if server icons/logos are introduced                                                                      |
| No separate sitemaps per content type            | Split into `sitemap-servers.xml`, `sitemap-guides.xml`, `sitemap-blog.xml` as content grows                   |

---

## 3. Content Improvements

### 3.1 Server Page Enrichment (165 pages)

This is the highest-leverage content improvement. Each page currently has ~100 words. Expanding to 500-800 words turns 165 thin pages into 165 keyword-targeting assets.

**Template for enriched server pages:**

```markdown
# {Server Name} MCP Server

{2-3 sentence overview of what this server does and why it matters}

## Key Features

- Feature 1
- Feature 2
- Feature 3

## Common Use Cases

1. **{Use case 1}**: {1-2 sentence description}
2. **{Use case 2}**: {1-2 sentence description}
3. **{Use case 3}**: {1-2 sentence description}

## Getting Started

### Prerequisites

- {Required accounts/APIs}
- {Environment variables needed}

### Install

\`\`\`bash
npx @getmcp/cli add {slug}
\`\`\`

### Configuration

{Tabbed config viewer — already exists}

## Troubleshooting

- **Common issue 1**: {solution}
- **Common issue 2**: {solution}

## Related Servers

- [{Related 1}](/servers/related-1) — {brief description}
- [{Related 2}](/servers/related-2) — {brief description}
- [{Related 3}](/servers/related-3) — {brief description}

## FAQ

**Q: {Common question}?**
A: {Answer}

**Q: {Common question}?**
A: {Answer}
```

**Implementation approach**: Use LLM-assisted content generation from each server's GitHub README/description, then human-review for accuracy. Start with top 20 most-searched servers.

### 3.2 App-Specific Setup Guides (19 NEW pages)

This is getmcp's **first-mover opportunity**. No competitor has dedicated per-app MCP setup pages. These target high-intent keywords like "Cursor MCP setup" and "VS Code MCP server configuration."

**Priority order** (by estimated search volume):

1. Claude Desktop
2. VS Code / Copilot
3. Cursor
4. Windsurf
5. Claude Code
6. Cline
7. Zed
8. PyCharm
9. Goose
10. Remaining 10 apps

**Template per guide:**

```markdown
# How to Install MCP Servers in {App Name}

## Overview

{App Name} uses {format} configuration with the `{rootKey}` key,
stored at `{config_path}`.

## Quick Install with getmcp

\`\`\`bash
npx @getmcp/cli add {server-example}
\`\`\`
getmcp auto-detects {App Name} and writes the correct config.

## Manual Configuration

1. Open {config_path}
2. Add the server entry: {example JSON/YAML/TOML}
3. Restart {App Name}

## Popular Servers for {App Name}

{Grid of 6-8 most relevant servers with install buttons}

## Troubleshooting

- Config file not found
- Server not connecting
- Environment variables not loading

## FAQ
```

### 3.3 Category Landing Pages (14 NEW pages)

Each category (`cloud`, `database`, `developer-tools`, etc.) gets a dedicated page with:

- 300-500 word overview of MCP servers in this category
- Filtered grid of relevant servers
- "Best for" recommendations
- Internal links to individual server pages
- FAQPage schema for rich results

### 3.4 Documentation Split (5+ NEW pages from 1)

The monolithic `/docs` page should be split for both SEO and usability:

| New URL                | Content Source               | Target Keyword                                        |
| ---------------------- | ---------------------------- | ----------------------------------------------------- |
| `/docs/installation`   | Getting started section      | "install getmcp", "npx getmcp cli"                    |
| `/docs/cli-reference`  | CLI commands section         | "getmcp CLI commands", "getmcp add"                   |
| `/docs/manifests`      | Project manifests section    | "getmcp.json", "MCP project manifest"                 |
| `/docs/library-api`    | Library usage section        | "getmcp API", "MCP config generator library"          |
| `/docs/contributing`   | Adding a server section      | "add MCP server to registry", "contribute MCP server" |
| `/docs/supported-apps` | Supported applications table | "MCP supported applications", "apps that support MCP" |

### 3.5 Blog Content Calendar (NEW section)

**Month 1 — Foundation articles:**
| # | Title | Target Keyword | Type |
|---|-------|---------------|------|
| 1 | "What is MCP? The Complete Guide to Model Context Protocol in 2026" | "what is MCP", "Model Context Protocol" | Pillar |
| 2 | "How to Install MCP Servers Across All Your AI Apps in One Command" | "install MCP server", "MCP CLI" | Tutorial |
| 3 | "getmcp vs Smithery: Which MCP Server Manager Should You Use?" | "getmcp vs smithery", "MCP manager comparison" | Comparison |
| 4 | "The 10 Best MCP Servers for Developers in 2026" | "best MCP servers 2026" | Listicle |

**Month 2 — App-specific SEO grab:**
| # | Title | Target Keyword | Type |
|---|-------|---------------|------|
| 5 | "MCP Servers for VS Code: Complete Setup Guide" | "VS Code MCP server" | Tutorial |
| 6 | "MCP Servers for Cursor: Everything You Need to Know" | "Cursor MCP setup" | Tutorial |
| 7 | "Why Your Team Needs a getmcp.json Manifest" | "MCP project manifest", "team MCP config" | Thought leadership |
| 8 | "MCP Servers for Database Integration: PostgreSQL, MongoDB, and More" | "MCP database server" | Category guide |

**Month 3 — Authority building:**
| # | Title | Target Keyword | Type |
|---|-------|---------------|------|
| 9 | "getmcp vs mcpm.sh: Multi-App MCP Server Management Compared" | "mcpm vs getmcp" | Comparison |
| 10 | "How We Built a Universal MCP Config Generator for 19 Apps" | "MCP config format" | Technical deep-dive |
| 11 | "The State of MCP Server Ecosystem: 2026 Edition" | "MCP ecosystem 2026" | Report |
| 12 | "Enterprise MCP: Managing Servers Across Development Teams" | "enterprise MCP", "team MCP" | Thought leadership |

---

## 4. UX & Design Improvements

### 4.1 Fix the /servers 404

`/servers` returns a 404. This is a critical UX and SEO failure — it's the most natural URL for the server directory and likely a target for internal/external links.

**Fix:** Create `/servers` as a proper index page (can mirror the homepage grid, or be an enhanced version with sidebar filters).

### 4.2 Smart Default for Config Tabs

The server pages show 19 config tabs — overwhelming for most users who only care about 1-2 apps.

**Improvement options:**

1. **Auto-detect from user agent/referrer** — if user came from a Cursor-related page, default to Cursor tab
2. **Remember last selection** — store preferred app in localStorage
3. **Show top 3 by popularity** — Claude Desktop, VS Code, Cursor — with "Show all 19 apps" toggle
4. **URL parameter** — `/servers/github?app=cursor` to deep-link specific config

### 4.3 Homepage Hierarchy

Current homepage is:

```
Hero → Stats → Server Grid (all 106 at once)
```

This works for power users but fails newcomers. Proposed hierarchy:

```
Hero (with improved messaging)
→ "What is MCP?" explanation (NEW)
→ Quick install CTA (prominent)
→ "Popular Servers" (top 8-12 curated)
→ Category browsing (14 cards linking to category pages)
→ Full server grid (below fold, with search + filters)
→ Supported apps showcase (19 app logos/badges)
→ Social proof (GitHub stars, npm downloads, team logos)
```

### 4.4 Server Card Enrichment

Current server cards show: name + brief description + tags.

**Add:**

- Author/publisher badge
- Runtime icon (node/python/docker)
- "Installed by X users" count (if available)
- Quick "Copy install command" button on card hover
- Category color accent (differentiate cloud from database from devtools)

### 4.5 Search Enhancement

Current: Basic text search filtering the server grid.

**Add:**

- **Autocomplete/typeahead** with popular servers
- **Filter by runtime** (node, python, docker)
- **Filter by transport** (stdio, http, sse)
- **Sort options** (alphabetical, popular, recently added)
- **Search result count** feedback ("Showing 12 of 106 servers")

### 4.6 Mobile Config Tab Experience

19 horizontal tabs on mobile is unusable. Replace with:

- **Dropdown selector** on screens < 768px
- **Grouped by format** (JSON apps | YAML apps | TOML apps | JSONC apps)

---

## 5. Backlink & Distribution Strategy

### 5.1 Immediate Backlink Targets

| Target                                           | Action                                                               | Expected Impact                               |
| ------------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- |
| **awesome-mcp-servers** (GitHub)                 | Submit PR to add getmcp as a tool/CLI                                | High — 5K+ stars, referenced by many articles |
| **PulseMCP directory**                           | Submit getmcp as a client/tool listing                               | Medium — direct referral traffic              |
| **mcp.so**                                       | Submit getmcp as a tool                                              | Medium                                        |
| **Official MCP Registry aggregators list**       | Submit PR to `registry/docs/registry-aggregators.mdx`                | High — official endorsement                   |
| **DEV.to**                                       | Publish "How I Built a Universal MCP Installer" article              | Medium — developer community reach            |
| **Hacker News**                                  | "Show HN: getmcp — One command to install MCP servers in 19 AI apps" | Very High (if it gains traction)              |
| **Reddit** (r/artificial, r/ChatGPT, r/ClaudeAI) | Share as a resource in relevant threads                              | Low-Medium                                    |
| **Product Hunt**                                 | Launch with "Universal MCP Server Installer" positioning             | Medium-High                                   |

### 5.2 Partnership Opportunities

| Partner                | Value Exchange                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Cursor team**        | Feature getmcp in their MCP setup docs → getmcp promotes Cursor as supported app       |
| **Windsurf team**      | Same — mutual documentation links                                                      |
| **Zed team**           | Same — especially valuable since Zed has growing MCP interest                          |
| **MCP server authors** | Add "Install with getmcp" badge to their READMEs → getmcp keeps their entry up to date |

### 5.3 Community Building

| Channel                 | Purpose                                                                    | Priority |
| ----------------------- | -------------------------------------------------------------------------- | -------- |
| **GitHub Discussions**  | Technical support, feature requests, server submissions                    | High     |
| **Discord server**      | Community chat, showcase, real-time help                                   | Medium   |
| **Twitter/X**           | New server announcements, tips, ecosystem news                             | Medium   |
| **npm README**          | Convert CLI users into website visitors                                    | High     |
| **CLI welcome message** | After first `npx @getmcp/cli add`, show "Visit getmcp.es for more servers" | High     |

---

## 6. Registry Growth Strategy

### 6.1 Current: 106 Servers (Bottom of Market)

| Directory      | Server Count | Ratio vs getmcp |
| -------------- | ------------ | --------------- |
| PulseMCP       | 8,600+       | 81x             |
| Smithery       | 7,300+       | 69x             |
| mcp.so         | 17,900+      | 169x            |
| mcpservers.org | 1,200+       | 11x             |
| **getmcp**     | **106**      | **1x**          |

### 6.2 Growth Plan

**Phase 1 (106 → 250): Sync with Official Registry**

- The official MCP Registry at `registry.modelcontextprotocol.io` has a public API
- Auto-import verified servers from the official registry
- Add automatic sync to stay current as new servers are registered
- This alone could 2-3x the catalog

**Phase 2 (250 → 500): Community Submissions**

- Simplify the "Add a server" process — web form instead of GitHub PR only
- "Claim your server" badge for server authors
- Weekly "New Servers" highlight on homepage/blog

**Phase 3 (500 → 1000): Automated Discovery**

- Scan GitHub for repos with `mcp` + `server` + `package.json` patterns
- Auto-generate entries with minimal metadata, flag for manual review
- Monitor npm for new `@modelcontextprotocol/*` and `*-mcp-server` packages

### 6.3 Quality Differentiation

Instead of competing on raw count (unwinnable against 17,900+ at mcp.so), differentiate on **quality per server**:

- **Verified configs**: Every server in getmcp is tested to actually install correctly
- **Multi-app support**: Every entry has configs for all 19 apps (competitors often have 1-3)
- **Rich metadata**: Author, runtime, transport, env vars, repository link
- **Status badges**: "Works", "Deprecated", "Requires review"

Position as: "106 servers that actually work in all your apps" > "8,600 servers, most untested"

---

## 7. Technical Product Improvements

### 7.1 `getmcp doctor` Web Interface

The CLI's `doctor` command diagnoses config issues. Build a web version:

- User pastes their config file content
- getmcp validates it, shows errors, suggests fixes
- Converts between formats (JSON ↔ YAML ↔ TOML)
- **SEO value**: Captures "MCP config error" and "fix MCP server config" searches

### 7.2 Config Playground

Interactive web tool:

1. Select a server
2. Select target apps (checkboxes)
3. Fill in environment variables
4. Get generated configs for all selected apps
5. One-click copy or download

**SEO value**: Captures "MCP config generator" searches. Unique interactive tool that no competitor offers on the web.

### 7.3 Server Compatibility Matrix

Create a visual matrix page showing which servers work with which apps:

- Rows: 106+ servers
- Columns: 19 apps
- Cells: ✅ tested / ⚠️ untested / ❌ incompatible
- Filterable by category, runtime, transport

**SEO value**: Captures "MCP server compatibility" and "which MCP servers work with [app]" queries.

### 7.4 Import/Migration Tool

Build a web-based tool that:

1. User uploads their existing MCP config (from any app)
2. getmcp identifies which servers are configured
3. Offers to sync to all other detected apps
4. Shows how to set up `getmcp.json` manifest for their team

**SEO value**: Captures "migrate MCP config" and "sync MCP servers across apps" queries.

---

## 8. Improvement Priority Matrix

| Improvement                              | Impact          | Effort | Priority                        |
| ---------------------------------------- | --------------- | ------ | ------------------------------- |
| Google Search Console registration       | 🔴 Critical     | Low    | **P0 — Do today**               |
| Fix /servers 404                         | 🔴 Critical     | Low    | **P0 — Do today**               |
| Title tag optimization (all pages)       | 🔴 Critical     | Low    | **P0 — This week**              |
| Homepage messaging overhaul              | 🟠 High         | Medium | **P1 — Week 1**                 |
| Add BreadcrumbList + Organization schema | 🟠 High         | Low    | **P1 — Week 1**                 |
| Initial backlink campaign (5-10 links)   | 🟠 High         | Medium | **P1 — Weeks 1-2**              |
| Server page content enrichment (top 20)  | 🟠 High         | High   | **P1 — Weeks 2-4**              |
| App-specific setup guides (top 5 apps)   | 🟠 High         | Medium | **P1 — Weeks 2-3**              |
| Category landing pages (14 pages)        | 🟡 Medium       | Medium | **P2 — Weeks 3-5**              |
| `/docs` split into multi-page            | 🟡 Medium       | Medium | **P2 — Weeks 3-5**              |
| Blog launch (first 4 posts)              | 🟡 Medium       | High   | **P2 — Weeks 4-6**              |
| Config playground (web tool)             | 🟡 Medium       | High   | **P2 — Weeks 5-8**              |
| Registry sync with official MCP Registry | 🟡 Medium       | Medium | **P2 — Weeks 4-6**              |
| Comparison pages (vs Smithery, mcpm)     | 🟡 Medium       | Medium | **P3 — Weeks 6-8**              |
| Smart config tab defaults                | 🟢 Nice-to-have | Low    | **P3 — Weeks 6-8**              |
| Doctor web interface                     | 🟢 Nice-to-have | High   | **P3 — Weeks 8-12**             |
| Server compatibility matrix              | 🟢 Nice-to-have | High   | **P3 — Weeks 8-12**             |
| Community (Discord, discussions)         | 🟢 Nice-to-have | Low    | **P3 — Weeks 8-12**             |
| Product Hunt launch                      | 🟡 Medium       | Low    | **P3 — After content is ready** |

---

## 9. Expected Outcomes

### If all P0 + P1 improvements implemented (first 4 weeks):

| Metric                     | Before | Expected After                                         |
| -------------------------- | ------ | ------------------------------------------------------ |
| Indexed pages              | 0      | 50-100                                                 |
| Monthly organic visits     | ~0     | 100-500                                                |
| Page count                 | 167    | ~210 (167 + 19 guides + 14 categories + ~10 blog/docs) |
| Avg. words per server page | ~100   | ~500 (top 20), ~100 (rest)                             |
| Referring domains          | ~0     | 5-15                                                   |
| Keyword rankings           | 0      | 20-50 long-tail keywords                               |

### If all improvements implemented (12 weeks):

| Metric                 | Before  | Expected After |
| ---------------------- | ------- | -------------- |
| Indexed pages          | 0       | 200-300        |
| Monthly organic visits | ~0      | 2,000-5,000    |
| Page count             | 167     | ~300+          |
| Registry servers       | 106     | 300-500        |
| Referring domains      | ~0      | 30-50          |
| GitHub stars           | 6       | 50-100         |
| npm weekly downloads   | Unknown | 500-1,000      |

---

_Report generated by WebScrapping Analysis Framework — 2026-02-26_
