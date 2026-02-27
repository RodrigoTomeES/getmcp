# getmcp.es — Implementation Plan

**URL:** https://getmcp.es
**Date:** 2026-02-26
**Based on:** ANALYSIS_REPORT.md + IMPROVEMENT_REPORT.md

---

## Plan Overview

A 12-week execution plan organized into 4 phases. Each phase builds on the previous, moving from **survival** (get indexed) to **growth** (content + authority) to **dominance** (community + differentiation).

**Core strategy:** Stop competing on server count. Win on multi-app support, content quality, and developer experience.

---

## Phase 1: Foundation (Weeks 1-2)

> **Goal:** Get indexed. Fix critical gaps. Establish baseline visibility.

### Week 1: Emergency SEO + Messaging

| #    | Task                               | Owner | Effort | Details                                                                                                                                                              |
| ---- | ---------------------------------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Register Google Search Console     | Dev   | 1h     | Verify ownership of `getmcp.es`, submit `sitemap.xml`, request indexation of homepage + `/docs` + top 10 server pages                                                |
| 1.2  | Register Bing Webmaster Tools      | Dev   | 30m    | Same process — covers Bing + DuckDuckGo (~5-8% of dev search)                                                                                                        |
| 1.3  | Verify SSR crawlability            | Dev   | 2h     | `curl -A "Googlebot" https://getmcp.es` → confirm full HTML with server data, not empty React shell. Fix if client-rendered.                                         |
| 1.4  | Set international targeting in GSC | Dev   | 15m    | Override `.es` geo-targeting to "International"                                                                                                                      |
| 1.5  | Add `hreflang="en"` to all pages   | Dev   | 1h     | Add `<link rel="alternate" hreflang="en" href="...">` + `hreflang="x-default"`                                                                                       |
| 1.6  | Optimize ALL title tags            | Dev   | 3h     | Homepage: "getmcp — Install MCP Servers in Claude, VS Code, Cursor & 16 More Apps". Server pages: "{Name} MCP Server — Install & Configure for 19 AI Apps \| getmcp" |
| 1.7  | Optimize meta descriptions         | Dev   | 3h     | Per page type — see IMPROVEMENT_REPORT.md §2.3                                                                                                                       |
| 1.8  | Fix `/servers` 404                 | Dev   | 2h     | Create proper servers index page (can redirect to homepage or be a dedicated listing)                                                                                |
| 1.9  | Update homepage messaging          | Dev   | 4h     | New hero: lead with "19 apps, one command." Add "What is MCP?" section. Downplay server count. Add social proof badges.                                              |
| 1.10 | Add structured data schemas        | Dev   | 3h     | Homepage: Organization + WebApplication. All pages: BreadcrumbList. Server pages: enhance SoftwareApplication with `offers`, `operatingSystem`.                      |

**Week 1 deliverables:** Site is crawlable, title tags optimized, homepage reframed, structured data enriched.

### Week 2: Initial Backlinks + Quick Content

| #    | Task                                        | Owner   | Effort | Details                                                                                                           |
| ---- | ------------------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| 2.1  | Submit to awesome-mcp-servers               | Dev     | 1h     | Open PR on `github.com/punkpeye/awesome-mcp-servers` adding getmcp as a CLI tool                                  |
| 2.2  | Submit to official MCP Registry aggregators | Dev     | 1h     | Open PR on `github.com/modelcontextprotocol/registry/docs/registry-aggregators.mdx`                               |
| 2.3  | Submit to PulseMCP                          | Dev     | 30m    | Submit getmcp as a client/tool at pulsemcp.com                                                                    |
| 2.4  | Submit to mcp.so                            | Dev     | 30m    | Submit getmcp listing                                                                                             |
| 2.5  | Post on DEV.to                              | Content | 4h     | "How I Built a Universal MCP Installer for 19 AI Apps" — link back to getmcp.es                                   |
| 2.6  | Post on Reddit                              | Content | 1h     | r/ClaudeAI, r/ChatGPT, r/artificial — share as resource, not spam                                                 |
| 2.7  | Update npm README                           | Dev     | 1h     | Add "Visit getmcp.es to browse servers" with prominent link in @getmcp/cli package                                |
| 2.8  | Add CLI cross-promotion                     | Dev     | 2h     | After first successful `npx @getmcp/cli add`, show message: "Browse 100+ more servers at getmcp.es"               |
| 2.9  | Create 3 app setup guides                   | Content | 6h     | `/guides/claude-desktop`, `/guides/vscode`, `/guides/cursor` — 800-1200 words each, step-by-step with screenshots |
| 2.10 | Improve sitemap                             | Dev     | 1h     | Per-page `lastmod` timestamps, priority tiers (popular servers at 0.9)                                            |

**Week 2 deliverables:** 5-10 external backlinks submitted, 3 high-value guide pages live, npm package driving traffic.

---

## Phase 2: Content Expansion (Weeks 3-6)

> **Goal:** Build a content moat. Create pages that rank for long-tail keywords.

### Weeks 3-4: Server Page Enrichment + More Guides

| #   | Task                                      | Owner         | Effort | Details                                                                                                                                                                |
| --- | ----------------------------------------- | ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Enrich top 20 server pages                | Content       | 16h    | Expand from ~100 to 500-800 words each. Add: features, use cases, getting started, troubleshooting, related servers, FAQ. See IMPROVEMENT_REPORT.md §3.1 for template. |
| 3.2 | Add "Related Servers" to all server pages | Dev           | 4h     | Automated by category tag — show 3-5 servers with same primary tag                                                                                                     |
| 3.3 | Add FAQPage schema to enriched pages      | Dev           | 2h     | JSON-LD FAQPage on each expanded server page                                                                                                                           |
| 3.4 | Create remaining 16 app setup guides      | Content       | 32h    | `/guides/windsurf`, `/guides/claude-code`, `/guides/cline`, ..., `/guides/antigravity` — 600-1000 words each                                                           |
| 3.5 | Create 14 category landing pages          | Content + Dev | 14h    | `/servers/category/cloud`, `/servers/category/database`, etc. — 300-500 word intro + filtered server grid + FAQPage schema                                             |
| 3.6 | Enrich next 30 server pages               | Content       | 24h    | Same template as 3.1, prioritized by search volume                                                                                                                     |

**Top 20 servers to enrich first** (estimated by search interest):

1. GitHub, 2. Playwright, 3. PostgreSQL, 4. Slack, 5. Docker, 6. MongoDB, 7. Kubernetes, 8. Brave Search, 9. Notion, 10. Jira, 11. Stripe, 12. AWS, 13. Discord, 14. OpenAI, 15. Anthropic, 16. Supabase, 17. Figma, 18. Sentry, 19. Shopify, 20. Firebase

### Weeks 5-6: Documentation Split + Blog Launch

| #   | Task                            | Owner   | Effort | Details                                                                                                                           |
| --- | ------------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Split `/docs` into 6 pages      | Dev     | 6h     | `/docs/installation`, `/docs/cli-reference`, `/docs/manifests`, `/docs/library-api`, `/docs/contributing`, `/docs/supported-apps` |
| 5.2 | Add docs sidebar navigation     | Dev     | 3h     | Left sidebar with section links, "On this page" TOC for long pages                                                                |
| 5.3 | Write blog post #1              | Content | 4h     | "What is MCP? The Complete Guide to Model Context Protocol in 2026" — 2000+ words, pillar content                                 |
| 5.4 | Write blog post #2              | Content | 3h     | "How to Install MCP Servers Across All Your AI Apps in One Command" — 1500 words, tutorial                                        |
| 5.5 | Write blog post #3              | Content | 4h     | "getmcp vs Smithery: Which MCP Server Manager Should You Use?" — 1500 words, comparison                                           |
| 5.6 | Write blog post #4              | Content | 3h     | "The 10 Best MCP Servers for Developers in 2026" — 1500 words, listicle                                                           |
| 5.7 | Build blog infrastructure       | Dev     | 4h     | Next.js MDX blog with RSS feed, OG images, author page                                                                            |
| 5.8 | Add HowTo schema to guide pages | Dev     | 2h     | JSON-LD HowTo on all `/guides/*` pages                                                                                            |

**Phase 2 deliverables:** 50 enriched server pages, 19 app guides, 14 category pages, 6 docs pages, 4 blog posts. Total pages: ~270 (from 167).

---

## Phase 3: Growth & Differentiation (Weeks 7-10)

> **Goal:** Build authority. Create unique tools. Grow the registry.

### Weeks 7-8: Registry Growth + Comparison Content

| #   | Task                                 | Owner   | Effort | Details                                                                                                                                               |
| --- | ------------------------------------ | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Auto-sync with official MCP Registry | Dev     | 16h    | Build script to pull from `registry.modelcontextprotocol.io/v0.1/servers`, auto-generate getmcp entries, flag for review. Target: 106 → 250+ servers. |
| 7.2 | Create comparison page: vs Smithery  | Content | 4h     | `/compare/smithery` — feature-by-feature comparison table, pros/cons, "best for" recommendation                                                       |
| 7.3 | Create comparison page: vs mcpm.sh   | Content | 3h     | `/compare/mcpm`                                                                                                                                       |
| 7.4 | Create comparison page: vs mcp-get   | Content | 3h     | `/compare/mcp-get`                                                                                                                                    |
| 7.5 | Write blog posts #5-#8               | Content | 12h    | Month 2 calendar from IMPROVEMENT_REPORT.md §3.5                                                                                                      |
| 7.6 | Simplify server submission           | Dev     | 8h     | Web form at `/submit` — author fills in name, package, description, env vars. Auto-validates, creates GitHub PR.                                      |
| 7.7 | Enrich remaining server pages        | Content | 20h    | Expand remaining ~85 server pages to 300-500 words                                                                                                    |

### Weeks 9-10: Interactive Tools

| #   | Task                               | Owner | Effort | Details                                                                                                                          |
| --- | ---------------------------------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 9.1 | Build Config Playground            | Dev   | 20h    | Interactive web tool: select server → select apps → fill env vars → get generated configs for all selected apps. One-click copy. |
| 9.2 | Build Doctor web interface         | Dev   | 12h    | Paste config → validate → show errors + fixes → convert between formats                                                          |
| 9.3 | Create Server Compatibility Matrix | Dev   | 8h     | Visual matrix page: servers × apps. Filterable by category, runtime, transport.                                                  |
| 9.4 | Hacker News "Show HN"              | Dev   | 2h     | Post after Config Playground launches — "Show HN: getmcp — Universal MCP config generator for 19 AI apps" with playground link   |
| 9.5 | Product Hunt launch                | Dev   | 4h     | Prepare assets, launch with "Universal MCP Server Installer" positioning                                                         |

**Phase 3 deliverables:** 250+ servers, 3 comparison pages, 8 blog posts total, Config Playground, Doctor web tool, Compatibility Matrix. Total pages: ~320+.

---

## Phase 4: Authority & Community (Weeks 11-12+)

> **Goal:** Establish getmcp as the go-to universal MCP tool. Build community.

### Weeks 11-12: Community + Partnerships

| #    | Task                                     | Owner   | Effort | Details                                                                                                     |
| ---- | ---------------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| 11.1 | Launch GitHub Discussions                | Dev     | 2h     | Enable on repo — categories: General, Feature Requests, Server Submissions, Support                         |
| 11.2 | Create Discord server                    | Dev     | 3h     | Channels: #general, #server-submissions, #support, #showcase                                                |
| 11.3 | Partner outreach (Cursor, Windsurf, Zed) | Dev     | 8h     | Email teams: "We generate configs for your app. Can we cross-link docs?"                                    |
| 11.4 | "Install with getmcp" badge program      | Dev     | 4h     | SVG badge for server authors to add to their READMEs: "Install with getmcp" → links to `/servers/{slug}`    |
| 11.5 | Write blog posts #9-#12                  | Content | 12h    | Month 3 calendar from IMPROVEMENT_REPORT.md §3.5                                                            |
| 11.6 | Add server analytics                     | Dev     | 8h     | Track npm installs per server, show "popularity" on server cards                                            |
| 11.7 | Automated content freshness              | Dev     | 6h     | Script to check each server's GitHub repo for updates, auto-flag stale entries, update `lastmod` in sitemap |
| 11.8 | Evaluate domain migration                | Dev     | 4h     | Research acquiring `getmcp.com` or `getmcp.dev`. Plan redirect strategy if migrating from `.es`.            |

### Ongoing (Week 12+)

| Task                           | Cadence    | Details                                                                 |
| ------------------------------ | ---------- | ----------------------------------------------------------------------- |
| Weekly blog post               | Every week | Target long-tail MCP keywords from keyword research                     |
| Monthly registry sync          | Monthly    | Pull new servers from official registry                                 |
| Quarterly competitive analysis | Quarterly  | Update comparison pages, check competitor features                      |
| Monitor GSC performance        | Weekly     | Track indexed pages, impressions, click-through rates, keyword rankings |
| Community moderation           | Daily      | Respond to GitHub issues, Discord questions, server submissions         |

---

## Resource Requirements

### Roles Needed

| Role                  | Responsibilities                                                                                | Allocation     |
| --------------------- | ----------------------------------------------------------------------------------------------- | -------------- |
| **Developer**         | Technical SEO, infrastructure, tools (Playground, Doctor, Matrix), registry sync, schema markup | ~60% of effort |
| **Content Writer**    | Server page enrichment, blog posts, guide pages, comparison pages, category pages               | ~35% of effort |
| **Community Manager** | Backlink outreach, social media, Discord/GitHub moderation, partnerships                        | ~5% of effort  |

### Effort Summary by Phase

| Phase               | Weeks        | Total Hours | Key Outcomes                                                     |
| ------------------- | ------------ | ----------- | ---------------------------------------------------------------- |
| Phase 1: Foundation | 1-2          | ~35h        | Indexed, title tags fixed, 5-10 backlinks, 3 guides              |
| Phase 2: Content    | 3-6          | ~115h       | 50 enriched server pages, 19 guides, 14 categories, 4 blog posts |
| Phase 3: Growth     | 7-10         | ~110h       | 250+ servers, Config Playground, Doctor tool, HN/PH launch       |
| Phase 4: Authority  | 11-12+       | ~50h+       | Community channels, partnerships, ongoing content                |
| **Total**           | **12 weeks** | **~310h**   |                                                                  |

---

## Success Metrics

### Phase 1 Exit Criteria (Week 2)

- [ ] Google Search Console verified and sitemap submitted
- [ ] At least 10 pages showing as "Discovered" or "Indexed" in GSC
- [ ] All 167+ title tags follow new format
- [ ] Homepage displays updated messaging (19 apps, not 106 servers)
- [ ] At least 3 backlinks submitted and accepted
- [ ] 3 app guide pages live

### Phase 2 Exit Criteria (Week 6)

- [ ] 50+ server pages enriched to 500+ words
- [ ] 19 app-specific guide pages live
- [ ] 14 category landing pages live
- [ ] Documentation split into 6+ pages
- [ ] 4 blog posts published
- [ ] Total indexed pages: 50+ in GSC

### Phase 3 Exit Criteria (Week 10)

- [ ] Registry: 250+ servers
- [ ] Config Playground live and functional
- [ ] 3 comparison pages published
- [ ] 8 blog posts total
- [ ] Monthly organic visits: 500+
- [ ] Referring domains: 15+

### Phase 4 Exit Criteria (Week 12)

- [ ] Community channels active (GitHub Discussions + Discord)
- [ ] At least 1 partnership with AI IDE team
- [ ] 12 blog posts total
- [ ] Monthly organic visits: 1,000+
- [ ] At least 3 keywords ranking page 1 for long-tail queries
- [ ] GitHub stars: 50+

---

## Risk Register

| Risk                                                          | Likelihood | Impact | Mitigation                                                                                                                         |
| ------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Google doesn't index `.es` domain effectively                 | Medium     | High   | Set international targeting in GSC, add hreflang. If persists after 4 weeks, pursue domain migration.                              |
| Smithery adds multi-format support                            | Low        | High   | Move faster on content + community. Multi-format is a feature, not a moat — content and DX are the real moat.                      |
| Anthropic Desktop Extensions eliminate CLI need               | Medium     | Medium | CLI still needed for non-Claude apps. Pivot messaging to "universal" (not just Claude). Blog about "beyond Desktop Extensions."    |
| Official MCP Registry becomes the directory                   | Medium     | Medium | Position getmcp as the "npm" layer that consumes the registry. Integrate, don't compete.                                           |
| Single developer burnout                                      | High       | High   | Prioritize ruthlessly (Phase 1 > Phase 2 > Phase 3 > Phase 4). Skip Phase 3 tools if under-resourced. Content can be LLM-assisted. |
| Content quality issues with LLM-generated server descriptions | Medium     | Medium | Human review all generated content. Focus on accuracy of install commands and env vars — these are critical.                       |

---

## Decision Log

| Decision                                        | Rationale                                                                                                                       | Date       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Lead with "19 apps" instead of "106 servers"    | getmcp loses on server count vs all competitors, but leads on app support.                                                      | 2026-02-26 |
| Prioritize app guides over blog posts           | App guides target high-intent transactional keywords where getmcp has unique value. Blog is informational and lower-converting. | 2026-02-26 |
| Build Config Playground before Doctor tool      | Playground showcases core value (multi-app config). Doctor is a utility. Playground is the demo that sells the product.         | 2026-02-26 |
| Don't pursue `.com` domain immediately          | Focus effort on content and SEO fixes first. Domain migration is disruptive. Reassess at Week 8 based on GSC data.              | 2026-02-26 |
| Sync with official registry rather than compete | The official registry is the source of truth. Being a "downstream aggregator with better DX" is a winning position.             | 2026-02-26 |

---

_Plan generated by WebScrapping Analysis Framework — 2026-02-26_
