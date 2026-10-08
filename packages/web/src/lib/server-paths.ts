import { getAllServers, getServerBySlug } from "@getmcp/registry";
import type { InternalRegistryEntry } from "@getmcp/registry";

/** Slugs always kept in a partial build, so verification checks stay stable. */
const REPRESENTATIVE_SLUGS = [
  "github-github",
  "data-prism",
  "pg-aiguide",
  "apify-apify",
  "sh-mcp",
  "pretrip",
  "bev-door",
  "0bridge",
];

/**
 * Optional cap for quick local builds (build-time only, never sent to the
 * client): `WEB_MAX_SERVER_PAGES=200 npx astro build --outDir node_modules/.partial-dist`.
 * Unset, empty or not a positive integer means every page is built.
 */
function getMaxServerPages(): number | undefined {
  const value = Number(process.env.WEB_MAX_SERVER_PAGES);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/**
 * Static paths for every `/servers/[id]` page (and its OG image).
 *
 * The previous Next.js site resolved `/servers/<slug>` with `getServerBySlug()`,
 * so when two entries share a slug the one stored in the slug index wins. We
 * keep that behavior by emitting one path per unique slug.
 */
export function getServerPaths(): Array<{
  params: { id: string };
  props: { server: InternalRegistryEntry };
}> {
  let slugs = new Set(getAllServers().map((s) => s.slug));
  const max = getMaxServerPages();
  if (max !== undefined) {
    const kept = REPRESENTATIVE_SLUGS.filter((slug) => slugs.has(slug));
    const ordered = [...new Set([...kept, ...slugs])];
    slugs = new Set(ordered.slice(0, Math.max(max, kept.length)));
  }
  return Array.from(slugs, (slug) => ({
    params: { id: slug },
    props: { server: getServerBySlug(slug)! },
  }));
}
