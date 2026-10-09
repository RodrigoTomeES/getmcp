# Visual regression tooling (getmcp web)

Scripts to compare the production site (<https://getmcp.es>, still the Next.js build) with a local Astro build of `packages/web`. Each page is captured full-page at 1440 px and 390 px. The capture also records a DOM/meta/style fingerprint and the page's OG image, then compares them pixel by pixel and structurally.

This folder is **not** an npm workspace: its dependencies (Playwright, pixelmatch, pngjs, sharp) are installed only when you use it, never by `npm ci` or CI.

## Setup (once per machine)

```bash
cd tools/vrt
npm run setup   # npm install + npx playwright install chromium
```

## Workflow

1. **Baseline from production.** Production rebuilds only once a day, after the daily registry sync, so same-day captures stay valid. Don't recapture it repeatedly.

   ```bash
   node capture.mjs prod https://getmcp.es
   ```

2. **Partial build of the branch** (never a full build locally: ~32 min, ~79,500 files). Run it from `packages/web`:

   ```bash
   WEB_MAX_SERVER_PAGES=200 timeout 900 npx astro build --outDir node_modules/.partial-dist
   ```

   - The partial build always includes the representative servers listed in `targets.mjs`.
   - `--outDir` must be on the same drive as the repo, otherwise Astro fails with `EXDEV`.
   - For a fair comparison, the branch must contain the same `chore(registry): daily sync` commit that production was built from. Otherwise counts and versions differ.

3. **Serve the build** in a separate terminal (stop it with Ctrl+C when done):

   ```bash
   node serve.mjs ../../packages/web/node_modules/.partial-dist
   ```

4. **Capture and compare:**

   ```bash
   node capture.mjs head http://localhost:4600
   node compare.mjs prod head
   ```

   - `compare.mjs` prints a table sorted by pixel difference, with the height change, the 50 px bands with the most differences, and which DOM aspects changed.
   - It writes diff images to `out/diff-head/` (red = different, magenta = area that exists in only one capture) and the details to `out/summary-head.json`.

5. **Look at a region side by side** (baseline | candidate | diff):

   ```bash
   node crop.mjs out/crop.png 120 900 1200 800 out/prod/servers.desktop.png out/head/servers.desktop.png out/diff-head/servers.desktop.png
   ```

6. **Smoke checks** on the served build. These run without bypassing CSP, so CSP violations appear. They also report console errors, `space-y-*` margin leaks from trailing `<script>` siblings, and test the config tabs, search and the mobile filters dialog:

   ```bash
   node check.mjs http://localhost:4600
   ```

7. **OG images** between two builds (old | new side-by-side images in `out/og-compare/`):

   ```bash
   node og-compare.mjs ../../packages/web/dist ../../packages/web/node_modules/.partial-dist
   ```

Afterwards stop the server and delete `packages/web/node_modules/.partial-dist`. Everything under `out/` is git-ignored.

## Notes

- **CSP:** `capture.mjs` uses Playwright's `bypassCSP`, only so it can inject a `<style>` that disables animations; the site's CSP blocks it otherwise. Use `check.mjs` to test the CSP itself.
- **Extensions:** ad blockers such as AdGuard rewrite the CSP in a regular browser (you will see `local.adguard.org` and a nonce). That comes from the extension, not from the site. Playwright's Chromium has no extensions.
- **Production data:** the Next.js site regenerated pages independently (ISR), so a production capture can mix two days of registry data. For example, the home page and `/servers` may show an older server count than the category pages.
- **Memory:** a long run once exhausted 32 GB of RAM with leaked `astro dev` servers and headless browsers. Prefer the partial build over `astro dev`, close every server and browser you start, and wrap long commands in `timeout`.

## Expected differences vs production (2026-10-09)

The latest results and open regressions are recorded in `WEB_PLAN.md` (section "Regresión visual"). Expected, intentional differences:

- **Categories:** paginated, 48 per page, sorted by stars.
- **Guides:** popular servers and an example config.
- **Pages:** a "Home" crumb in the breadcrumbs, and correct spaces in "… guide →".
- **Mobile header:** the "beta" pill is hidden.
- **`/servers`:** production's off-screen mobile filter sheet leaks into its desktop full-page screenshot.
- **Fonts and OG images:** Fira Mono glyphs can render 1 px apart because Fontsource keeps the hinting. OG images differ by 0.2–1.1% because of library versions and the palette PNG.
