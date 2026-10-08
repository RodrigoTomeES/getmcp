import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

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
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // resvg ships a native `.node` binary that must be loaded by Node, not bundled.
    optimizeDeps: { exclude: ["@resvg/resvg-js"] },
    ssr: { external: ["@resvg/resvg-js"] },
  },
});
