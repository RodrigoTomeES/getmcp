import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import buildReport from "./integrations/build-report.ts";

export default defineConfig({
  site: "https://getmcp.es",
  output: "static",
  // `/servers/foo` is emitted as `servers/foo.html` so URLs keep the same shape
  // as the previous Next.js site (no trailing slash).
  trailingSlash: "never",
  build: {
    format: "file",
    // Render pages in parallel: OG image rasterization (resvg) runs off the
    // main thread, so this overlaps it across the ~38k server pages.
    concurrency: 8,
  },
  fonts: [
    {
      name: "Fira Mono",
      cssVariable: "--font-fira-mono",
      provider: fontProviders.fontsource(),
      weights: [400, 500],
      styles: ["normal"],
      // symbols2 holds the box-drawing glyphs (█ ╗ ═ ║) of the ASCII logos.
      subsets: ["latin", "symbols2"],
      fallbacks: ["monospace"],
    },
  ],
  env: {
    schema: {
      // Cloudflare Web Analytics site token; unset = no beacon. Must be set where the build runs.
      PUBLIC_CF_ANALYTICS_TOKEN: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },
  // Content Security Policy, emitted as a <meta> on every page. Astro hashes its
  // own scripts and styles; `is:inline` scripts add their hash via
  // `Astro.csp.insertScriptHash` in BaseLayout. An allowlist, not
  // 'strict-dynamic': the site is static with one third-party script (the
  // Cloudflare beacon). style-src-attr 'unsafe-inline' keeps `style` attributes
  // (Astro markup and React style props) working; img-src https: covers remote
  // server icons. A meta CSP cannot be report-only or carry frame-ancestors or
  // report-to, so those and HSTS are host headers (ROADMAP 6b, phase 2).
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
      ],
      scriptDirective: {
        resources: ["'self'", "https://static.cloudflareinsights.com"],
      },
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
  // buildReport logs the build size report (and writes the GitHub job summary).
  integrations: [react(), buildReport()],
  vite: {
    plugins: [tailwindcss()],
    // resvg and sharp (OG images) ship native binaries that must be loaded by Node, not bundled.
    optimizeDeps: { exclude: ["@resvg/resvg-js", "sharp"] },
    ssr: { external: ["@resvg/resvg-js", "sharp"] },
  },
});
