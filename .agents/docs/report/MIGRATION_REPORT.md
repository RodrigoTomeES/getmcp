# getmcp.es → installmcp.dev — Domain Migration Report

**Current Domain:** https://getmcp.es
**New Domain:** https://installmcp.dev
**Date:** 2026-02-26
**Migration Type:** ccTLD (Spain-locked) → gTLD (global) + brand URL change

---

## 1. Executive Summary

This migration moves getmcp from a Spain-locked `.es` ccTLD to a globally-treated `.dev` gTLD. This is the single highest-impact change possible for organic growth — it unlocks 99%+ of the addressable MCP developer market that was previously invisible to.

**Key facts about `.dev`:**

- Google-owned gTLD — treated as global (no geo-restriction)
- HTTPS enforced at the TLD level (HSTS preloaded in all browsers) — no HTTP possible
- Strong developer association — signals "dev tool" to the target audience
- Standard registration price (~$12/yr)

**Migration complexity: MEDIUM.** The site is a Next.js app on Vercel with 167 pages. The main work is updating hardcoded URL references across the codebase, setting up 301 redirects, and updating the ecosystem (npm, GitHub, CLI output).

**Estimated total effort: 8–12 hours** (broken into phases below).

---

## 2. Pre-Migration Checklist

Complete these BEFORE touching any code or DNS:

### 2.1 Domain Setup

| #   | Task                                                    | Details                                                                                                                                       | Time |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | **Configure DNS for installmcp.dev**                    | Point to Vercel: add CNAME record `cname.vercel-dns.com` (or A records `76.76.21.21`). Vercel will auto-provision SSL (mandatory for `.dev`). | 15m  |
| 2   | **Add domain in Vercel Dashboard**                      | Project Settings → Domains → Add `installmcp.dev`. Set as primary domain. Keep `getmcp.es` as redirect source.                                | 10m  |
| 3   | **Verify SSL certificate**                              | `.dev` requires HTTPS. Vercel auto-provisions Let's Encrypt certs. Verify at `https://installmcp.dev` before proceeding.                      | 5m   |
| 4   | **Register Google Search Console** for `installmcp.dev` | Go to search.google.com/search-console → Add property → URL prefix: `https://installmcp.dev`. Verify via DNS TXT record or HTML file.         | 15m  |
| 5   | **Register Bing Webmaster Tools** for `installmcp.dev`  | Go to bing.com/webmasters → Add site → Verify                                                                                                 | 10m  |

### 2.2 Baseline Snapshot

Take these measurements BEFORE migration to have comparison data:

| Metric                         | How to Measure                  | Current Value       |
| ------------------------------ | ------------------------------- | ------------------- |
| Google indexed pages           | `site:getmcp.es` in Google      | 0 (not indexed yet) |
| Bing indexed pages             | `site:getmcp.es` in Bing        | Unknown             |
| GSC impressions (last 28 days) | GSC → Performance               | ~0                  |
| Referring domains              | Ahrefs/Semrush or GSC Links     | ~0                  |
| npm weekly downloads           | npmjs.com/@getmcp/cli           | Check               |
| GitHub stars                   | github.com/RodrigoTomeES/getmcp | 6                   |

**Note:** Since getmcp.es currently has ~0 indexed pages, this migration has ZERO risk of losing existing SEO equity. This is actually the ideal time to migrate — before any authority has accumulated on the `.es` domain.

---

## 3. Code Changes (Next.js Application)

### 3.1 Environment / Config — Domain Reference

Find and replace all hardcoded `getmcp.es` references in the codebase. The primary locations in a Next.js app:

```bash
# Find all references to getmcp.es in the codebase
grep -r "getmcp\.es" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" .
```

**Expected locations and changes:**

| File / Pattern                      | Current Value                                         | New Value                                         |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| `next.config.js` / `next.config.ts` | Any `getmcp.es` in config                             | `installmcp.dev`                                  |
| `.env` / `.env.production`          | `NEXT_PUBLIC_SITE_URL=https://getmcp.es` (or similar) | `NEXT_PUBLIC_SITE_URL=https://installmcp.dev`     |
| `app/layout.tsx` (root metadata)    | `metadataBase: new URL('https://getmcp.es')`          | `metadataBase: new URL('https://installmcp.dev')` |
| `app/sitemap.ts`                    | Base URL for sitemap generation                       | `https://installmcp.dev`                          |
| `app/robots.ts`                     | Sitemap URL reference                                 | `https://installmcp.dev/sitemap.xml`              |
| `package.json`                      | `homepage` field (if present)                         | `https://installmcp.dev`                          |

### 3.2 Metadata — All Page Types

#### Root Layout (`app/layout.tsx`)

```tsx
// BEFORE
export const metadata: Metadata = {
  metadataBase: new URL("https://getmcp.es"),
  title: "getmcp — Universal MCP Server Directory",
  // ...
  alternates: {
    canonical: "https://getmcp.es",
  },
};

// AFTER
export const metadata: Metadata = {
  metadataBase: new URL("https://installmcp.dev"),
  title: "getmcp — Install MCP Servers in Claude, VS Code, Cursor & 16 More Apps",
  // ...
  alternates: {
    canonical: "https://installmcp.dev",
    languages: {
      en: "https://installmcp.dev",
      "x-default": "https://installmcp.dev",
    },
  },
};
```

#### Server Pages (`app/servers/[slug]/page.tsx`)

Update `generateMetadata` and JSON-LD:

```tsx
// BEFORE
alternates: {
  canonical: `https://getmcp.es/servers/${server.id}`,
}

// AFTER
alternates: {
  canonical: `https://installmcp.dev/servers/${server.id}`,
  languages: {
    'en': `https://installmcp.dev/servers/${server.id}`,
    'x-default': `https://installmcp.dev/servers/${server.id}`,
  },
}
```

#### JSON-LD on ALL Pages

Every JSON-LD block that references `getmcp.es` must be updated:

```json
// BEFORE
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://getmcp.es"
}

// AFTER
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://installmcp.dev"
}
```

**All JSON-LD URLs to update:**

- `WebSite.url`
- `SoftwareApplication.url`
- `SoftwareApplication.mainEntityOfPage.@id`
- `SoftwareApplication.installUrl`
- `SoftwareApplication.image`
- `BreadcrumbList.itemListElement[].item`
- `Organization.url`
- `WebApplication.url`
- `CollectionPage.url`
- `ItemList.itemListElement[].url`
- `Publisher.url`

If the JSON-LD is generated from a single base URL variable (e.g., `SITE_URL`), you only need to change one place. If hardcoded in templates, use find-and-replace.

#### Open Graph Tags

```html
<!-- BEFORE -->
<meta property="og:url" content="https://getmcp.es/servers/github" />

<!-- AFTER -->
<meta property="og:url" content="https://installmcp.dev/servers/github" />
```

In Next.js, if you're using `metadataBase`, the OG URLs are auto-generated from it. Changing `metadataBase` should cascade to all OG URLs.

### 3.3 Sitemap (`app/sitemap.ts`)

```tsx
// BEFORE
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://getmcp.es";
  // ...
}

// AFTER
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://installmcp.dev";
  // ...
}
```

### 3.4 Robots.txt (`app/robots.ts`)

```tsx
// BEFORE
export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: "https://getmcp.es/sitemap.xml",
    // ...
  };
}

// AFTER
export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: "https://installmcp.dev/sitemap.xml",
    // ...
  };
}
```

### 3.5 hreflang Tags (NEW — Add During Migration)

Add to the root layout or per-page metadata. This signals to Google that the content is English and globally targeted:

```tsx
// In generateMetadata or root layout
alternates: {
  canonical: `https://installmcp.dev/${path}`,
  languages: {
    'en': `https://installmcp.dev/${path}`,
    'x-default': `https://installmcp.dev/${path}`,
  },
},
```

This generates:

```html
<link rel="alternate" hreflang="en" href="https://installmcp.dev/..." />
<link rel="alternate" hreflang="x-default" href="https://installmcp.dev/..." />
```

### 3.6 Internal Links

Search for any hardcoded `https://getmcp.es` in link `href` attributes, markdown content, or component props:

```bash
grep -r "https://getmcp\.es" --include="*.tsx" --include="*.ts" --include="*.md" --include="*.mdx" .
```

Most internal links in Next.js use relative paths (`/servers/github`) which don't need changing. Only absolute URLs need updating.

---

## 4. 301 Redirect Configuration

### 4.1 Vercel Redirect Setup

**Option A: Vercel Dashboard (Simplest)**

In Vercel Dashboard → Project Settings → Domains:

1. Add `installmcp.dev` as the primary domain
2. Keep `getmcp.es` added but set to **redirect to `installmcp.dev`**
3. Vercel auto-creates 301 redirects for all paths

This is the recommended approach — Vercel handles the entire redirect chain automatically.

**Option B: `vercel.json` (More Control)**

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "getmcp.es"
        }
      ],
      "destination": "https://installmcp.dev/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.getmcp.es"
        }
      ],
      "destination": "https://installmcp.dev/:path*",
      "permanent": true
    }
  ]
}
```

**Option C: Next.js Config (`next.config.ts`)**

```ts
const nextConfig = {
  async redirects() {
    return [
      // Only needed if Vercel domain-level redirect isn't used
      // Vercel Dashboard redirect is preferred
    ];
  },
};
```

### 4.2 Redirect Rules

| Old URL                            | New URL                                 | Status |
| ---------------------------------- | --------------------------------------- | ------ |
| `https://getmcp.es/`               | `https://installmcp.dev/`               | 301    |
| `https://getmcp.es/docs`           | `https://installmcp.dev/docs`           | 301    |
| `https://getmcp.es/servers/{slug}` | `https://installmcp.dev/servers/{slug}` | 301    |
| `https://getmcp.es/sitemap.xml`    | `https://installmcp.dev/sitemap.xml`    | 301    |
| `https://www.getmcp.es/*`          | `https://installmcp.dev/*`              | 301    |

**Critical:** All 167 URLs must redirect with exact path matching. The wildcard pattern `/:path*` → `/:path*` handles this automatically.

### 4.3 Redirect Verification

After deployment, verify with curl:

```bash
# Check homepage redirect
curl -I https://getmcp.es
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://installmcp.dev/

# Check server page redirect
curl -I https://getmcp.es/servers/github
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://installmcp.dev/servers/github

# Check docs redirect
curl -I https://getmcp.es/docs
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://installmcp.dev/docs

# Check new domain serves content
curl -I https://installmcp.dev
# Expected: HTTP/1.1 200 OK
```

---

## 5. Google Search Console Migration

### 5.1 Change of Address Tool

1. Go to **GSC for getmcp.es** → Settings → Change of Address
2. Select `installmcp.dev` as the new site
3. Google will verify:
   - 301 redirects are in place (old → new)
   - Both properties are verified by the same user
   - New site serves content (not error pages)
4. Submit the change

**Note:** Since getmcp.es has ~0 indexed pages, Google's migration will be fast (nothing to re-crawl). The main benefit is telling Google to index the new domain immediately.

### 5.2 Sitemap Submission

In GSC for `installmcp.dev`:

1. Go to Sitemaps → Submit `https://installmcp.dev/sitemap.xml`
2. Request indexing of the homepage: URL Inspection → `https://installmcp.dev` → Request Indexing
3. Request indexing of key pages:
   - `https://installmcp.dev/docs`
   - `https://installmcp.dev/servers/github`
   - `https://installmcp.dev/servers/playwright`
   - `https://installmcp.dev/servers/postgres` (or top servers by interest)

### 5.3 Bing Webmaster Tools

Repeat the same process:

1. Add `installmcp.dev` in Bing Webmaster Tools
2. Submit sitemap
3. Use "Site Move" tool to notify Bing of the domain change

---

## 6. Ecosystem Updates

### 6.1 npm Packages

| Package              | Field to Update             | New Value                |
| -------------------- | --------------------------- | ------------------------ |
| `@getmcp/cli`        | `package.json` → `homepage` | `https://installmcp.dev` |
| `@getmcp/cli`        | README.md → website links   | `https://installmcp.dev` |
| `@getmcp/core`       | `package.json` → `homepage` | `https://installmcp.dev` |
| `@getmcp/generators` | `package.json` → `homepage` | `https://installmcp.dev` |
| `@getmcp/registry`   | `package.json` → `homepage` | `https://installmcp.dev` |

**Publish new versions** of all packages with updated URLs. The npm package pages show the `homepage` field prominently — this drives referral traffic.

### 6.2 CLI Output Messages

Search the CLI codebase for any URLs displayed to users:

```bash
grep -r "getmcp\.es" packages/cli/
```

Update any output messages like:

```
// BEFORE
"Browse 100+ more servers at https://getmcp.es"

// AFTER
"Browse 100+ more servers at https://installmcp.dev"
```

### 6.3 GitHub Repository

| Location                    | Update                                                   |
| --------------------------- | -------------------------------------------------------- |
| Repository description      | Change URL from getmcp.es to installmcp.dev              |
| Repository website field    | Set to `https://installmcp.dev`                          |
| README.md                   | Replace all `getmcp.es` references with `installmcp.dev` |
| CONTRIBUTING.md (if exists) | Update URLs                                              |
| GitHub Pages (if used)      | Not applicable (hosted on Vercel)                        |

### 6.4 External Listings & Backlinks

Reach out to update URLs on any external sites that link to getmcp.es:

| Platform                           | Action                             |
| ---------------------------------- | ---------------------------------- |
| awesome-mcp-servers (if submitted) | Open PR to update URL              |
| PulseMCP (if submitted)            | Update listing URL                 |
| mcp.so (if submitted)              | Update listing URL                 |
| DEV.to (if posted)                 | Edit article to use new URL        |
| Reddit posts (if posted)           | Can't edit — redirects handle this |
| Any other directories              | Update where possible              |

**The 301 redirects handle all existing links automatically**, but updating the actual URLs is better for long-term SEO (avoids redirect chains, passes full link equity).

---

## 7. DNS Configuration

### 7.1 installmcp.dev DNS Records

| Type  | Name  | Value                          | TTL |
| ----- | ----- | ------------------------------ | --- |
| A     | `@`   | `76.76.21.21`                  | 300 |
| AAAA  | `@`   | (Vercel IPv6, check dashboard) | 300 |
| CNAME | `www` | `cname.vercel-dns.com`         | 300 |

Or alternatively (simpler):

| Type  | Name | Value                  | TTL |
| ----- | ---- | ---------------------- | --- |
| CNAME | `@`  | `cname.vercel-dns.com` | 300 |

**Note:** Some DNS providers don't support CNAME on the apex (`@`). Use A records in that case.

### 7.2 getmcp.es DNS Records

**Keep getmcp.es DNS pointing to Vercel.** The redirects only work if the old domain resolves. Do NOT remove DNS records for getmcp.es.

### 7.3 SSL Certificates

- **installmcp.dev**: `.dev` TLD mandates HTTPS (HSTS preloaded). Vercel auto-provisions SSL. No action needed.
- **getmcp.es**: Keep SSL active for redirect responses. Vercel handles this automatically when both domains are configured on the same project.

---

## 8. Phased Migration Timeline

### Day 1: Preparation (2-3 hours)

| #   | Task                                                                   | Time          |
| --- | ---------------------------------------------------------------------- | ------------- |
| 1   | Configure installmcp.dev DNS → Vercel                                  | 15m           |
| 2   | Add installmcp.dev to Vercel project as primary domain                 | 10m           |
| 3   | Wait for DNS propagation + SSL provisioning                            | 30-60m (wait) |
| 4   | Verify `https://installmcp.dev` loads (may show old getmcp.es content) | 5m            |
| 5   | Register installmcp.dev in Google Search Console                       | 15m           |
| 6   | Register installmcp.dev in Bing Webmaster Tools                        | 10m           |

### Day 1-2: Code Changes (3-4 hours)

| #   | Task                                                                        | Time |
| --- | --------------------------------------------------------------------------- | ---- |
| 7   | Create a new git branch: `feature/domain-migration`                         | 2m   |
| 8   | Global find-and-replace: `getmcp.es` → `installmcp.dev` in all source files | 30m  |
| 9   | Update `metadataBase` in root layout                                        | 5m   |
| 10  | Update sitemap base URL                                                     | 5m   |
| 11  | Update robots.txt sitemap reference                                         | 5m   |
| 12  | Add `hreflang` tags (`en` + `x-default`) to all page types                  | 30m  |
| 13  | Update all JSON-LD schemas with new URLs                                    | 30m  |
| 14  | Update OG tags (auto if using `metadataBase`, manual if hardcoded)          | 15m  |
| 15  | Add 301 redirects in `vercel.json` (or configure via Vercel Dashboard)      | 15m  |
| 16  | Run local build to verify no broken references: `npm run build`             | 10m  |
| 17  | Search for any remaining `getmcp.es` references: `grep -r "getmcp\.es" .`   | 10m  |
| 18  | Commit and deploy to staging/preview                                        | 10m  |

### Day 2: Verification (1-2 hours)

| #   | Task                                                        | Time |
| --- | ----------------------------------------------------------- | ---- |
| 19  | Test staging deployment: all pages load on installmcp.dev   | 15m  |
| 20  | Verify 301 redirects (curl -I on 5-10 representative URLs)  | 15m  |
| 21  | Check JSON-LD with Google Rich Results Test on 3 page types | 15m  |
| 22  | Check OG tags with opengraph.xyz on 3 page types            | 10m  |
| 23  | Check canonical tags on 3 page types (view source)          | 10m  |
| 24  | Check sitemap.xml references new domain                     | 5m   |
| 25  | Check robots.txt references new sitemap                     | 5m   |
| 26  | **Deploy to production**                                    | 5m   |

### Day 2-3: Search Console + Ecosystem (2-3 hours)

| #   | Task                                                                 | Time |
| --- | -------------------------------------------------------------------- | ---- |
| 27  | Submit sitemap in GSC: `https://installmcp.dev/sitemap.xml`          | 5m   |
| 28  | Request indexing of homepage + top 5 pages in GSC                    | 15m  |
| 29  | Use "Change of Address" tool in GSC (getmcp.es → installmcp.dev)     | 15m  |
| 30  | Use "Site Move" in Bing Webmaster Tools                              | 10m  |
| 31  | Update npm packages (homepage field + README) → publish new versions | 30m  |
| 32  | Update GitHub repo description + website field + README              | 15m  |
| 33  | Update CLI output messages referencing the website                   | 15m  |
| 34  | Update any external listings (awesome-lists, directories)            | 30m  |

### Week 1-2: Monitoring

| #   | Task                                          | Cadence      |
| --- | --------------------------------------------- | ------------ |
| 35  | Check GSC for indexed pages on installmcp.dev | Daily        |
| 36  | Verify redirects still working                | Every 2 days |
| 37  | Check for crawl errors in GSC                 | Every 2 days |
| 38  | Monitor organic impressions by country        | Weekly       |

---

## 9. URL Mapping Reference

All 167 pages maintain identical paths. Only the domain changes:

| Page Type              | Old URL                                | New URL                                     |
| ---------------------- | -------------------------------------- | ------------------------------------------- |
| Homepage               | `https://getmcp.es/`                   | `https://installmcp.dev/`                   |
| Docs                   | `https://getmcp.es/docs`               | `https://installmcp.dev/docs`               |
| Server: GitHub         | `https://getmcp.es/servers/github`     | `https://installmcp.dev/servers/github`     |
| Server: Playwright     | `https://getmcp.es/servers/playwright` | `https://installmcp.dev/servers/playwright` |
| Server: PostgreSQL     | `https://getmcp.es/servers/postgres`   | `https://installmcp.dev/servers/postgres`   |
| ... (165 server pages) | `https://getmcp.es/servers/{slug}`     | `https://installmcp.dev/servers/{slug}`     |
| Sitemap                | `https://getmcp.es/sitemap.xml`        | `https://installmcp.dev/sitemap.xml`        |
| Robots                 | `https://getmcp.es/robots.txt`         | `https://installmcp.dev/robots.txt`         |
| OG Images              | `https://getmcp.es/opengraph-image`    | `https://installmcp.dev/opengraph-image`    |

---

## 10. Product Name vs. Domain Name

**Important distinction:** The product is still called **"getmcp"**. Only the domain changes to `installmcp.dev`.

| Element                   | Value                              | Changes?    |
| ------------------------- | ---------------------------------- | ----------- |
| Product name              | getmcp                             | No change   |
| npm scope                 | @getmcp/\*                         | No change   |
| CLI command               | `npx @getmcp/cli`                  | No change   |
| GitHub repo               | RodrigoTomeES/getmcp               | No change   |
| Website domain            | ~~getmcp.es~~ → **installmcp.dev** | **Changed** |
| Brand in `<title>`        | "getmcp"                           | No change   |
| JSON-LD Organization name | "getmcp"                           | No change   |
| og:site_name              | "getmcp"                           | No change   |

The product identity stays "getmcp" everywhere. Only URLs pointing to the website change. This avoids the need to rename npm packages, update import paths, or rebrand the GitHub organization.

**Messaging for users:** "getmcp is now at installmcp.dev" — simple, clear, no confusion.

---

## 11. SEO Impact Analysis

### 11.1 What You Gain

| Benefit                      | Impact                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| **Global search visibility** | From Spain-only (~333K devs) to worldwide (~10M+ MCP devs)                         |
| **Developer TLD trust**      | `.dev` signals "developer tool" instead of "Spanish company"                       |
| **HTTPS enforcement**        | `.dev` has HSTS preloaded — impossible to serve insecure content                   |
| **Keyword in domain**        | "installmcp" contains the exact action verb ("install") + product category ("mcp") |
| **No geo-restriction**       | Google treats `.dev` as generic — full international targeting available           |

### 11.2 What You Risk

| Risk                          | Severity    | Mitigation                                                  |
| ----------------------------- | ----------- | ----------------------------------------------------------- |
| Temporary ranking drop        | **NONE**    | Site has 0 indexed pages — nothing to lose                  |
| Lost backlinks                | **MINIMAL** | ~0 referring domains. 301 redirects preserve any that exist |
| Bookmark breakage             | **LOW**     | 301 redirects ensure bookmarks still work                   |
| CLI users hitting old domain  | **LOW**     | Old CLI versions show getmcp.es — 301 redirect handles it   |
| Brand confusion (two domains) | **LOW**     | 301 redirect means only one working domain                  |

### 11.3 Domain Keyword Advantage

The new domain `installmcp.dev` contains two valuable keywords:

- **"install"** — matches the primary user action and high-value keyword cluster ("install MCP server")
- **"mcp"** — the category term

Google does give a slight ranking signal to exact-match or partial-match domains. While this signal has been reduced over the years, for a new site competing in a niche market, every edge helps.

---

## 12. Rollback Plan

If something goes wrong:

### Quick Rollback (< 5 minutes)

1. In Vercel Dashboard → Project Settings → Domains
2. Set `getmcp.es` back as primary domain
3. Remove or deprioritize `installmcp.dev`
4. Revert the git branch (if code changes were deployed)

### When to Rollback

- 500 errors on installmcp.dev that can't be fixed quickly
- SSL certificate issues on installmcp.dev
- DNS propagation taking too long (>48 hours)
- Vercel project configuration conflicts

### When NOT to Rollback

- Google hasn't indexed installmcp.dev yet (normal — takes days/weeks)
- Traffic temporarily drops (it was ~0 anyway)
- Old bookmarks show redirect page briefly (this is expected and correct)

---

## 13. Post-Migration: Keep getmcp.es Active

**Do NOT delete or let getmcp.es expire for at least 12 months.**

Reasons:

- Old CLI versions (already installed by users) reference getmcp.es in output
- Any external links pointing to getmcp.es need the 301 redirect active
- Google needs time to fully process the domain change
- Cached search results may still show getmcp.es URLs

**Maintenance:** Keep getmcp.es DNS pointing to Vercel. The redirect configuration handles everything. Cost: only the domain renewal fee (~$10-15/yr for `.es`).

---

## 14. Verification Checklist

Use this checklist after deployment to confirm everything is working:

### Redirects

- [ ] `curl -I https://getmcp.es` → 301 to `https://installmcp.dev/`
- [ ] `curl -I https://getmcp.es/docs` → 301 to `https://installmcp.dev/docs`
- [ ] `curl -I https://getmcp.es/servers/github` → 301 to `https://installmcp.dev/servers/github`
- [ ] `curl -I https://www.getmcp.es` → 301 to `https://installmcp.dev/`

### New Domain Content

- [ ] `https://installmcp.dev/` → 200 OK with full homepage content
- [ ] `https://installmcp.dev/docs` → 200 OK with docs content
- [ ] `https://installmcp.dev/servers/github` → 200 OK with server page
- [ ] `https://installmcp.dev/sitemap.xml` → valid sitemap with installmcp.dev URLs
- [ ] `https://installmcp.dev/robots.txt` → references installmcp.dev sitemap

### Metadata

- [ ] View source on homepage: `<link rel="canonical" href="https://installmcp.dev/">`
- [ ] View source on homepage: `<meta property="og:url" content="https://installmcp.dev/">`
- [ ] View source on server page: canonical points to `installmcp.dev/servers/{slug}`
- [ ] View source on server page: JSON-LD `url` is `installmcp.dev/servers/{slug}`
- [ ] View source: `hreflang="en"` present on all pages
- [ ] View source: `hreflang="x-default"` present on all pages
- [ ] No remaining `getmcp.es` references in page source (except redirects)

### Search Console

- [ ] installmcp.dev verified in Google Search Console
- [ ] Sitemap submitted and accepted (no errors)
- [ ] "Change of Address" submitted from getmcp.es property
- [ ] installmcp.dev verified in Bing Webmaster Tools

### Ecosystem

- [ ] npm package pages show installmcp.dev as homepage
- [ ] GitHub repo shows installmcp.dev as website
- [ ] CLI output references installmcp.dev

### Rich Results

- [ ] Google Rich Results Test passes for `https://installmcp.dev/`
- [ ] Google Rich Results Test passes for `https://installmcp.dev/servers/github`
- [ ] No structured data errors in GSC (check after 48 hours)

---

## 15. Quick Reference: Find & Replace Commands

Run these in the project root to catch all references:

```bash
# 1. Find all getmcp.es references
grep -rn "getmcp\.es" --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.jsx" --include="*.json" --include="*.md" --include="*.mdx" \
  --include="*.yaml" --include="*.yml" --include="*.toml" --include="*.env*" .

# 2. Replace in source files (review diff before committing!)
# Using sed (Linux/macOS):
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec sed -i 's/getmcp\.es/installmcp.dev/g' {} +

# 3. Verify no references remain
grep -rn "getmcp\.es" --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.json" --include="*.md" . | grep -v node_modules | grep -v .next

# 4. Build and check for errors
npm run build
```

---

## 16. Summary

| Phase              | Tasks                                                 | Time      | Priority   |
| ------------------ | ----------------------------------------------------- | --------- | ---------- |
| **DNS + Hosting**  | Configure domain, SSL, Vercel                         | 1h        | Day 1      |
| **Code Changes**   | Find/replace URLs, metadata, JSON-LD, sitemap, robots | 3-4h      | Day 1-2    |
| **301 Redirects**  | Configure getmcp.es → installmcp.dev redirects        | 30m       | Day 2      |
| **Verification**   | Test redirects, metadata, content, structured data    | 1-2h      | Day 2      |
| **Search Console** | Register, submit sitemap, Change of Address tool      | 30m       | Day 2-3    |
| **Ecosystem**      | npm packages, GitHub, CLI, external listings          | 1-2h      | Day 3      |
| **Monitoring**     | GSC indexed pages, crawl errors, impressions          | Ongoing   | Week 1-4   |
| **Total**          |                                                       | **8-12h** | **3 days** |

**The migration is low-risk (no existing SEO equity to lose) and high-reward (unlocks global visibility).** The `.dev` TLD is a strong signal for the developer audience, and the keyword "install" in the domain perfectly matches the product's core action.

---

_Report generated by WebScrapping Analysis Framework — 2026-02-26_
