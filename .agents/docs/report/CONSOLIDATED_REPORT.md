# getmcp.es — Consolidated Strategic Report

**URL:** https://getmcp.es
**Date:** 2026-02-26
**Reports Synthesized:** Analysis, Improvement, Plan, Geo Analysis, Keyword Research, Metadata Spec

---

## The One-Line Diagnosis

**getmcp has a genuinely differentiated product (19-app universal MCP installer) trapped behind a country-locked domain, zero indexed pages, thin content, and invisible structured data — in a market growing 232% annually.**

---

## 1. What getmcp Is

A developer tool that solves MCP configuration fragmentation. Nineteen AI applications use 6 different root keys across 4 formats (JSON, JSONC, YAML, TOML). getmcp provides:

- **CLI tool** (`npx @getmcp/cli add {server}`) — auto-detects installed apps, writes correct config for each
- **Web directory** (getmcp.es) — 106 servers across 14 categories, browsable with search + filters
- **Library** (npm packages) — programmatic config generation, Zod validation, registry search
- **Project manifests** (`getmcp.json`) — teams share MCP configs via a single file

Built as a TypeScript monorepo with 586+ tests, MIT licensed, library-first architecture.

---

## 2. The Three Critical Problems

### Problem 1: The Domain (Geo Analysis)

The `.es` ccTLD hard-locks the site to Spain in Google's targeting. This **cannot be overridden** in Search Console. Every competitor uses a globally-treated TLD (`.ai`, `.io`, `.com`, `.sh`).

| Metric                     | With `.es`        | With global TLD |
| -------------------------- | ----------------- | --------------- |
| Addressable MCP developers | <1% (Spain only)  | 100% (global)   |
| Google geo-targeting       | Spain             | International   |
| Developer TLD perception   | "Spanish company" | "Dev tool"      |

**Impact:** Even if all other issues are fixed, organic search will remain limited to Spanish SERPs.

### Problem 2: Zero Visibility (Keyword Research + SEO)

- **0 pages indexed** by Google
- **0 keywords** ranking
- **0 referring domains** detected
- Not mentioned in any MCP directory roundup, awesome-list, or blog post

The site is invisible to its target audience.

### Problem 3: Thin Content + Weak Metadata (Content Analysis + Metadata Spec)

- Server pages average ~100 words (template-driven config dumps)
- No blog, tutorials, app guides, category pages, or comparison content
- JSON-LD is present but **missing critical properties** (`offers`, correct `author @type`) — no rich results eligible
- Title tags don't contain "MCP Server" keyword
- Homepage leads with "106 servers" (dead last vs competitors' 8,600+)

---

## 3. The One Thing getmcp Has That Nobody Else Does

**Universal multi-format, multi-app configuration generation.**

| Feature                         | getmcp                       | Smithery | mcpm     | PulseMCP | mcp.so |
| ------------------------------- | ---------------------------- | -------- | -------- | -------- | ------ |
| Apps supported                  | **19**                       | 19       | 14       | N/A      | N/A    |
| Config formats                  | **4** (JSON/JSONC/YAML/TOML) | 1        | 1        | N/A      | N/A    |
| Multi-app install (one command) | **Yes**                      | No       | No       | No       | No     |
| Project manifests               | **Yes**                      | No       | Profiles | No       | No     |
| Offline/local                   | **Yes**                      | No       | Partial  | N/A      | N/A    |

No competitor generates YAML for Goose, TOML for Codex, JSONC for OpenCode, and JSON for everyone else — from one command. This is a genuine moat.

**But the website never communicates this clearly.** The hero says "One config format, every AI app" — which is correct but abstract. The homepage leads with "106 servers" — a metric where getmcp finishes last.

---

## 4. Strategic Repositioning

### Current Positioning (Losing)

> "MCP server directory with 106 servers"
> Competing against: mcp.so (17,900+), PulseMCP (8,600+), Smithery (7,300+)

### Recommended Positioning (Winning)

> "The only universal MCP installer — one command, 19 AI apps, 4 config formats"
> Competing against: add-mcp (9 apps), install-mcp (limited), mcpm (no web directory)

### The Keyword Formula

Every title, H1, meta description, and CTA should use:

> **"[action verb] MCP server [in/across/for] [number] AI apps"**

Examples:

- "Install any MCP server into 19 AI apps with one command"
- "Generate MCP configs for JSON, YAML, and TOML automatically"
- "Sync MCP servers across Claude, VS Code, Cursor, and 16 more"

---

## 5. The Opportunity Map

### 5.1 Market Context

| Metric                  | Value                                |
| ----------------------- | ------------------------------------ |
| MCP server count growth | 232% (Aug 2025 → Feb 2026)           |
| Monthly SDK downloads   | 97M+                                 |
| Backing companies       | Anthropic, OpenAI, Google, Microsoft |
| Market projection       | $10.3B by 2026                       |
| Developer AI tool usage | 84% of developers                    |

### 5.2 Keyword Opportunity Tiers

**Tier 1 — OWN THESE** (low competition, perfect product fit):

- App-specific setup: 11 of 19 apps have virtually zero competition for "{App} MCP setup"
- Problem-solving: "sync MCP across apps," "MCP config different format," "MCP env vars"
- Niche formats: "Goose MCP YAML," "Codex MCP TOML" — only getmcp generates these

**Tier 2 — COMPETE FOR** (medium competition, differentiable):

- "install MCP server," "MCP CLI tool," "Smithery alternatives"
- App guides for Claude Desktop, VS Code, Cursor, Windsurf
- Category pages for database, automation, communication, developer-tools

**Tier 3 — LONG TERM** (high competition, authority needed):

- "MCP servers," "MCP server directory," "best MCP servers 2026"

### 5.3 Content Expansion Impact

| Metric                | Current  | After Phase 1+2 (6 weeks) |
| --------------------- | -------- | ------------------------- |
| Total pages           | 167      | ~270                      |
| Pages with 500+ words | 1 (docs) | 70+                       |
| Keyword targets       | 0        | 54+ specific clusters     |
| App-specific guides   | 0        | 19                        |
| Category pages        | 0        | 14                        |
| Blog posts            | 0        | 4+                        |

---

## 6. Metadata Quick Wins

The structured data fixes require ~4 hours total and enable rich result eligibility:

| Fix                                                  | Impact                                   | Time   |
| ---------------------------------------------------- | ---------------------------------------- | ------ |
| Add `offers: { price: "0" }` to all server pages     | Enables SoftwareApplication rich results | 15 min |
| Fix `author @type` from Person to Organization       | Eliminates validation errors             | 15 min |
| Set `url` to getmcp.es canonical + add `downloadUrl` | Correct entity association               | 30 min |
| Add BreadcrumbList JSON-LD                           | Desktop SERP breadcrumbs                 | 1h     |
| Add Organization + WebApplication to homepage        | Brand entity establishment               | 1h     |
| Change server `og:type` from `article` to `website`  | Correct semantics                        | 15 min |
| Add `twitter:site` / `twitter:creator`               | Social card completeness                 | 15 min |

---

## 7. Consolidated Action Plan

### Week 1: Survival (Get Found)

| #   | Action                                                                          | Source Report        | Effort |
| --- | ------------------------------------------------------------------------------- | -------------------- | ------ |
| 1   | Register Google Search Console + submit sitemap                                 | SEO/Plan             | 1h     |
| 2   | Register Bing Webmaster Tools                                                   | SEO/Plan             | 30m    |
| 3   | Add `hreflang="en"` + `hreflang="x-default"` to all pages                       | Geo Analysis         | 1h     |
| 4   | Set international targeting in GSC (if possible for ccTLD)                      | Geo Analysis         | 15m    |
| 5   | Fix all 167+ title tags: "{Name} MCP Server — Install for 19 AI Apps \| getmcp" | Keyword Research     | 3h     |
| 6   | Fix all meta descriptions with action keywords                                  | Keyword Research     | 3h     |
| 7   | Apply all P0 metadata fixes (offers, author type, url, mainEntityOfPage)        | Metadata Spec        | 1h     |
| 8   | Apply all P1 metadata fixes (BreadcrumbList, Organization, og:type, twitter)    | Metadata Spec        | 2h     |
| 9   | Fix `/servers` 404 → create proper index page                                   | Analysis/Improvement | 2h     |
| 10  | Update homepage messaging: lead with "19 apps, one command"                     | Improvement          | 4h     |

### Weeks 2-3: Content Sprint

| #   | Action                                                                          | Source Report    | Effort |
| --- | ------------------------------------------------------------------------------- | ---------------- | ------ |
| 11  | Submit to awesome-mcp-servers, official registry aggregators, PulseMCP, mcp.so  | Improvement/Plan | 3h     |
| 12  | Post on DEV.to + Reddit                                                         | Improvement/Plan | 5h     |
| 13  | Update npm README with website link                                             | Improvement/Plan | 1h     |
| 14  | Create 5 priority app guides (Claude Desktop, VS Code, Cursor, Windsurf, Goose) | Keyword Research | 10h    |
| 15  | Create 5 underserved app guides (Codex, Zed, Cline, Claude Code, OpenCode)      | Keyword Research | 10h    |
| 16  | Enrich top 20 server pages to 500-800 words                                     | Improvement      | 16h    |
| 17  | Add "Related Servers" cross-links to all server pages                           | Improvement      | 4h     |

### Weeks 4-6: Scale

| #   | Action                                                                      | Source Report    | Effort |
| --- | --------------------------------------------------------------------------- | ---------------- | ------ |
| 18  | Create remaining 9 app guides                                               | Keyword Research | 18h    |
| 19  | Create 14 category landing pages                                            | Keyword Research | 14h    |
| 20  | Split /docs into 6 pages                                                    | Improvement      | 6h     |
| 21  | Write 4 blog posts (MCP guide, install tutorial, vs Smithery, best servers) | Plan             | 14h    |
| 22  | Enrich next 30 server pages                                                 | Improvement      | 24h    |
| 23  | Add ItemList schema to homepage + CollectionPage to categories              | Metadata Spec    | 3h     |

### Weeks 7-10: Differentiate

| #   | Action                                                 | Source Report    | Effort |
| --- | ------------------------------------------------------ | ---------------- | ------ |
| 24  | Build Config Playground (interactive web tool)         | Improvement      | 20h    |
| 25  | Auto-sync with official MCP Registry (106 → 250+)      | Improvement/Plan | 16h    |
| 26  | Create 3 comparison pages (vs Smithery, mcpm, add-mcp) | Keyword Research | 10h    |
| 27  | Hacker News "Show HN" launch                           | Plan             | 2h     |
| 28  | Build Doctor web interface                             | Improvement      | 12h    |

### Weeks 11-12: Community

| #   | Action                                          | Source Report    | Effort |
| --- | ----------------------------------------------- | ---------------- | ------ |
| 29  | Launch GitHub Discussions                       | Plan             | 2h     |
| 30  | Partner outreach to Cursor, Windsurf, Zed teams | Improvement/Plan | 8h     |
| 31  | "Install with getmcp" badge program             | Improvement      | 4h     |
| 32  | Evaluate domain migration based on GSC data     | Geo Analysis     | 4h     |

---

## 8. The Domain Question

This is the elephant in the room across all reports.

**The data is clear:**

- `.es` is hard-locked to Spain by Google (confirmed by Google's own documentation)
- Spain represents <1% of the MCP developer market
- Every single competitor uses a globally-treated TLD
- No combination of hreflang, backlinks, or content can fully overcome this

**Our recommendation:**

1. **Weeks 1-8:** Implement all fixes on `.es`. Build content. Build backlinks. Track GSC data.
2. **Week 8:** Review GSC country data. If <10% of impressions come from non-Spain, domain migration is mandatory.
3. **If migrating:** Preferred targets in order: `getmcp.dev` > `getmcp.io` (if acquirable) > `getmcp.com`. Set up 301 redirects, update all canonical tags, resubmit GSC.

The domain decision is **high-impact but not urgent enough to block all other work.** Content, metadata, and backlink fixes provide value regardless of domain.

---

## 9. Success Metrics Dashboard

| Metric                      | Now     | Week 4             | Week 8    | Week 12     |
| --------------------------- | ------- | ------------------ | --------- | ----------- |
| **Indexed pages**           | 0       | 50+                | 150+      | 250+        |
| **Total pages**             | 167     | 210+               | 270+      | 320+        |
| **Keywords ranking**        | 0       | 10-20              | 30-50     | 50-100      |
| **Monthly organic visits**  | ~0      | 100-300            | 500-2,000 | 2,000-5,000 |
| **Referring domains**       | 0       | 5-10               | 15-25     | 30-50       |
| **Registry servers**        | 106     | 106                | 250+      | 300+        |
| **GitHub stars**            | 6       | 15-25              | 30-50     | 50-100      |
| **Server page avg. words**  | ~100    | 300                | 500       | 600         |
| **Rich result eligibility** | 0 pages | 165+ (SoftwareApp) | 200+      | 300+        |
| **Blog posts**              | 0       | 2                  | 4         | 8-12        |

---

## 10. Risk Summary

| Risk                                         | Probability | Impact   | Mitigation                                                                   |
| -------------------------------------------- | ----------- | -------- | ---------------------------------------------------------------------------- |
| `.es` blocks organic growth permanently      | High        | Critical | Domain migration at Week 8 if data confirms                                  |
| Smithery adds multi-format support           | Low         | High     | Content + community are the real moat, not just the feature                  |
| Official MCP Registry becomes the directory  | Medium      | Medium   | Position as downstream aggregator with better DX                             |
| Anthropic Desktop Extensions reduce CLI need | Medium      | Medium   | CLI serves 18 non-Claude apps — pivot messaging accordingly                  |
| Single developer burnout                     | High        | High     | Ruthless prioritization: Phase 1 > 2 > 3 > 4. LLM-assist content generation. |

---

## 11. Report Index

| Report                  | File                     | Lines     | Focus                                                       |
| ----------------------- | ------------------------ | --------- | ----------------------------------------------------------- |
| Analysis Report         | `ANALYSIS_REPORT.md`     | 334       | Site audit, architecture, competitive landscape, SWOT       |
| Improvement Report      | `IMPROVEMENT_REPORT.md`  | 577       | All improvements across SEO, content, UX, product           |
| Implementation Plan     | `PLAN.md`                | 230       | 12-week phased execution with tasks, effort, milestones     |
| Geo Analysis            | `GEO_ANALYSIS.md`        | 265       | ccTLD impact, audience geography, domain strategy           |
| Keyword Research        | `KEYWORD_RESEARCH.md`    | 372       | SERP analysis, keyword tiers, content-keyword mapping       |
| Metadata Spec           | `METADATA_SPEC.md`       | 389       | JSON-LD schemas, OG tags, rich results, implementation code |
| **Consolidated Report** | `CONSOLIDATED_REPORT.md` | This file | Strategic synthesis of all findings                         |

**Total intelligence generated: ~2,200 lines across 7 reports.**

---

## 12. Final Verdict

getmcp is a **technically excellent product with a near-fatal distribution problem**. The MCP market is exploding and the window for establishing a "universal installer" brand is open now — but closing fast as competitors grow.

The path forward is clear:

1. **Fix the domain** (or accept organic limitations)
2. **Fix the metadata** (4 hours of work)
3. **Build content** (app guides are the highest-ROI content type)
4. **Build links** (awesome-lists, DEV.to, HN)
5. **Lead with the moat** ("19 apps, one command" not "106 servers")

The product deserves to be found. The website needs to make that possible.

---

_Consolidated report generated by WebScrapping Analysis Framework — 2026-02-26_
