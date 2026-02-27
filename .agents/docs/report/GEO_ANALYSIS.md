# getmcp.es — Geo Analysis Report

**URL:** https://getmcp.es
**Date:** 2026-02-26
**Specialist:** Geo Analysis Expert

---

## 1. Executive Summary

getmcp.es uses a `.es` (Spain) country-code TLD to serve a global English-language developer audience. This creates a **fundamental geographic mismatch** that is arguably the single biggest barrier to organic growth. Google hard-locks `.es` to Spain — this cannot be overridden in Search Console. Every competitor uses a globally-treated TLD (`.ai`, `.io`, `.com`, `.sh`). The site's primary audience (US ~31%, India ~6%, UK ~4%) will rarely see `.es` results in their SERPs.

**Severity: CRITICAL**

---

## 2. ccTLD Impact Analysis

### 2.1 Google's Treatment of `.es`

| Factor                    | `.es` (getmcp)              | `.io` / `.ai` / `.sh` (competitors)           |
| ------------------------- | --------------------------- | --------------------------------------------- |
| Google geo-targeting      | **Hard-locked to Spain**    | Treated as generic (global)                   |
| Search Console override   | **Not possible** for ccTLDs | Full international targeting control          |
| SERP visibility by region | Spain only (default)        | Worldwide                                     |
| Developer perception      | "Spanish company"           | ".io = startup", ".ai = AI tool", ".sh = CLI" |

Google's documentation is unambiguous: ccTLDs like `.es` are "definite country-targeting signals." Unlike `.io`, `.ai`, `.tv`, and `.co` (which Google has reclassified as generic), `.es` **remains country-locked to Spain**.

Key distinction:

- **`.io`** (British Indian Ocean Territory) → treated as **generic** by Google → 1.6M+ registrations, dominant dev TLD
- **`.ai`** (Anguilla) → treated as **generic** by Google → $32M+ in revenue from AI companies
- **`.es`** (Spain) → treated as **country-specific** by Google → primarily Spanish businesses

### 2.2 Mitigation Effectiveness

| Mitigation                             | Effectiveness   | Notes                                                             |
| -------------------------------------- | --------------- | ----------------------------------------------------------------- |
| `hreflang="en"` tags                   | 🟡 Partial      | Signals English language but does NOT override country geo-signal |
| Backlinks from global .com/.io domains | 🟡 Partial      | Can partially counterbalance, but domain remains strongest signal |
| English-only content                   | 🟡 Partial      | Helps language detection, not geographic targeting                |
| Google Search Console targeting        | 🔴 Not possible | GSC cannot override ccTLD geo-targeting                           |
| Direct/referral traffic                | 🟢 Unaffected   | Social links, CLI referrals, bookmarks bypass SEO                 |

**Bottom line:** No combination of on-page fixes can fully overcome the `.es` geo-restriction for organic search. Only a domain migration or heavy reliance on non-organic traffic channels can solve this.

---

## 3. Target Audience Geography

### 3.1 MCP Developer Distribution

Based on Claude/Anthropic traffic data (87.6M monthly visitors) and developer surveys:

| Region             | Share of MCP Interest | Developer Population | Priority          |
| ------------------ | --------------------- | -------------------- | ----------------- |
| **United States**  | ~31%                  | ~4.4M developers     | Primary           |
| **India**          | ~6%                   | ~5.8M developers     | Secondary         |
| **United Kingdom** | ~4.4%                 | ~400K developers     | Secondary         |
| **South Korea**    | ~3.4%                 | ~600K developers     | Tertiary          |
| **France**         | ~3.4%                 | ~500K developers     | Tertiary          |
| **Germany**        | ~3% (est.)            | ~900K developers     | Tertiary          |
| **Japan**          | ~2% (est.)            | ~700K developers     | Tertiary          |
| **Canada**         | ~2% (est.)            | ~300K developers     | Tertiary          |
| **Brazil**         | ~1.5% (est.)          | ~750K developers     | Tertiary          |
| **Spain**          | **<1%**               | **333K developers**  | **Not strategic** |

### 3.2 Spain's Developer Market

| Metric                       | Value                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| Software developers          | 333,000                                                         |
| Software industry size       | EUR 18.6B (2025)                                                |
| AI adoption rate (workplace) | 78% (highest in Europe)                                         |
| MCP-specific activity        | Negligible — no Spanish-language MCP tools or communities found |

Spain has high general AI adoption but **virtually zero MCP-specific activity**. All MCP documentation, tools, and communities operate in English. Spanish developers working with MCP use English-language resources.

### 3.3 Spanish-Language MCP Content

Searches for Spanish MCP terms:

- "MCP servidor" — minimal results, mostly translations of English articles
- "protocolo de contexto de modelo" — Wikipedia article exists, few other resources
- "instalar servidor MCP" — no meaningful results
- "servidores MCP para IA" — a few translated listicles (BrightData, etc.)

**Assessment:** The Spanish-language MCP market is derivative and minuscule. It does not justify a `.es` TLD strategy.

### 3.4 Latin America Opportunity

| Country         | Developers | Language                 |
| --------------- | ---------- | ------------------------ |
| Brazil          | ~750K      | Portuguese (not Spanish) |
| Mexico          | ~560K      | Spanish                  |
| Argentina       | ~150K      | Spanish                  |
| Colombia        | ~85K       | Spanish                  |
| **Total LATAM** | **~2M**    | Mixed                    |

Even if targeting Spanish-speaking developers were the goal, `.es` only geo-targets **Spain** — not Mexico, Argentina, Colombia, or any LATAM market. A `.com` or `.dev` domain would be necessary to reach LATAM.

---

## 4. Competitor Domain Strategy

### 4.1 Domain Comparison

| Product        | Domain         | TLD Type            | Google Treatment |
| -------------- | -------------- | ------------------- | ---------------- |
| Smithery       | smithery.ai    | Generic             | Global           |
| PulseMCP       | pulsemcp.com   | Generic             | Global           |
| mcp.so         | mcp.so         | Generic\*           | Global           |
| mcp-get        | mcp-get.com    | Generic             | Global           |
| mcpm           | mcpm.sh        | Generic\*           | Global           |
| mcpservers.org | mcpservers.org | Generic             | Global           |
| Glama          | glama.ai       | Generic             | Global           |
| getmcp.io      | getmcp.io      | Generic             | Global           |
| getmcp.cc      | getmcp.cc      | Generic\*           | Global           |
| **getmcp.es**  | **getmcp.es**  | **Country (Spain)** | **Spain only**   |

\*`.so` (Somalia), `.sh` (St. Helena), `.cc` (Cocos Islands) are all treated as generic by Google.

**getmcp.es is the ONLY MCP tool using a country-locked ccTLD.** Every single competitor uses a globally-treated domain.

### 4.2 Brand Confusion Risk

Three domains share the "getmcp" brand:

- **getmcp.es** — This site (directory + CLI)
- **getmcp.io** — Separate project (open registry)
- **getmcp.cc** — Separate project (desktop installer, $19-39 paid)

This dilutes brand signals and creates ranking confusion. Google may split authority across these domains.

---

## 5. Geographic SEO Strategy

### 5.1 Domain Migration Options (Ranked)

| Option                                         | Pros                                                             | Cons                                          | Recommendation               |
| ---------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| **Migrate to `getmcp.dev`**                    | Google-owned gTLD, HTTPS required, dev-focused, likely available | Migration effort, redirect setup              | **Best option** if available |
| **Migrate to `getmcp.io`**                     | Developer recognition, globally treated                          | May conflict with existing getmcp.io project  | Good if acquirable           |
| **Acquire `getmcp.com`**                       | Universal trust                                                  | Likely expensive or unavailable               | Check availability           |
| **Keep `.es` + heavy hreflang**                | No migration effort                                              | Limited effectiveness, permanent SEO handicap | **Not recommended**          |
| **Keep `.es` for Spain + new gTLD for global** | Covers both markets                                              | Splits authority across two domains           | Not recommended              |

### 5.2 If Migration Is Not Possible (Short-Term Mitigations)

1. **Add `hreflang` tags to every page:**

   ```html
   <link rel="alternate" hreflang="en" href="https://getmcp.es/..." />
   <link rel="alternate" hreflang="x-default" href="https://getmcp.es/..." />
   ```

2. **Build backlinks from global-TLD domains** — .com, .io, .org, .dev sites linking to getmcp.es can partially counterbalance the geo-signal

3. **Maximize non-organic traffic channels:**
   - npm CLI cross-promotion (every `npx @getmcp/cli` install → link to website)
   - GitHub README links
   - Dev community posts (DEV.to, Reddit, HN)
   - Social media presence

4. **Google Search Console**: Register and verify. While you can't override geo-targeting for ccTLDs, GSC provides:
   - Indexation monitoring
   - Crawl error detection
   - Performance data by country (to measure Spain vs. international traffic)

### 5.3 International Content Strategy

If staying on `.es`:

| Content Strategy                   | Purpose                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- |
| All content in English             | The MCP audience uses English universally                              |
| No Spanish-language version needed | ROI too low — <1% of MCP market                                        |
| Target long-tail English keywords  | Less competitive, less affected by geo-signals                         |
| Focus on branded searches          | Users searching "getmcp" will find the site regardless of TLD          |
| CLI → website funnel               | Bypass organic search entirely by converting CLI users to web visitors |

---

## 6. Market Opportunity by Region

### 6.1 MCP Ecosystem Growth

| Metric                  | Value                                | Source                     |
| ----------------------- | ------------------------------------ | -------------------------- |
| MCP server count growth | 232% (Aug 2025 → Feb 2026)           | MCP Adoption Statistics    |
| Monthly SDK downloads   | 97M+ (Python + TypeScript)           | MCP First Anniversary Blog |
| Published MCP servers   | 10,000+                              | MCP Registry               |
| MCP clients             | 300+                                 | MCP Ecosystem Reports      |
| Market projection       | $10.3B by 2026 (34.6% CAGR)          | Industry Analysts          |
| Backing companies       | Anthropic, OpenAI, Google, Microsoft | Official announcements     |

### 6.2 Regional MCP Maturity

| Region             | Maturity | Key Signal                                                                                      |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| **US**             | Mature   | Home to Anthropic, OpenAI, Microsoft, Google. 31% of Claude traffic. Most MCP tools built here. |
| **Western Europe** | Growing  | UK, Germany, France strong. Berlin + London are MCP engineering hubs.                           |
| **East Asia**      | Growing  | South Korea 3.4% of Claude traffic. Japan and China have AI ecosystems adopting MCP.            |
| **India**          | Emerging | 6.3% of Claude traffic but more consumer than enterprise MCP adoption.                          |
| **LATAM**          | Early    | Brazil largest market. Content consumed in English. Limited native MCP tools.                   |
| **Spain**          | Minimal  | High general AI adoption (78%) but negligible MCP-specific activity.                            |

### 6.3 Addressable Market Quantification

| Scenario                            | Addressable Developers                   | % of Global MCP Users |
| ----------------------------------- | ---------------------------------------- | --------------------- |
| **With `.es` (Spain only)**         | ~333K developers (fraction use MCP)      | **<1%**               |
| **With global TLD (.io/.dev/.com)** | ~10M+ MCP-active developers              | **100%**              |
| **Opportunity cost of `.es`**       | Missing 99%+ of the MCP developer market |                       |

---

## 7. Recommendations

### Priority 1: Domain Strategy Decision (Week 1)

**Decision required:** Migrate to a global TLD or commit to non-organic growth channels.

- **If migrating:** Choose `.dev` (best developer signal) or `.io` (most recognized). Set up 301 redirects from all `.es` URLs to new domain. Update canonical tags, sitemap, GSC. Timeline: 2-4 weeks.
- **If staying on `.es`:** Accept that organic search will be heavily limited. Invest aggressively in CLI → website funnel, community links, and branded search.

### Priority 2: hreflang Implementation (Week 1)

Regardless of migration decision, add immediately:

```html
<link rel="alternate" hreflang="en" href="https://getmcp.es/{path}" />
<link rel="alternate" hreflang="x-default" href="https://getmcp.es/{path}" />
```

### Priority 3: Non-Organic Traffic Channels (Weeks 1-4)

Since organic search is compromised by the TLD, invest heavily in:

1. **CLI cross-promotion** — 100% of CLI users see website link
2. **npm README** — Every package page links to getmcp.es
3. **GitHub presence** — Comprehensive README, awesome-list submissions
4. **Developer communities** — DEV.to, Reddit, Hacker News, Discord
5. **Social media** — Twitter/X for new server announcements

### Priority 4: Monitor Geographic Performance (Ongoing)

Track in Google Search Console:

- Impressions by country (Spain vs. US vs. others)
- Click-through rates by country
- Keywords driving traffic from non-Spain regions
- If <10% of impressions come from non-Spain after 4 weeks, migration is mandatory

---

## 8. Key Insight

Google itself phased out its own ccTLD search domains (google.es, google.de, etc.) in April 2025, redirecting everything to google.com. Their reasoning: "improvements in localization make country-level domains no longer necessary." If Google doesn't believe in ccTLDs for geographic targeting anymore, a developer tool shouldn't either.

**The `.es` domain is the single most impactful issue to resolve.** It affects every other recommendation in every other report — title tag optimization, content expansion, structured data — all have reduced ROI when the domain itself limits visibility to <1% of the target market.

---

_Report generated by WebScrapping Analysis Framework — 2026-02-26_
