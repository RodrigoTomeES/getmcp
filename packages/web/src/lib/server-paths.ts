import { getAllServers, getServerBySlug } from "@getmcp/registry";
import type { InternalRegistryEntry } from "@getmcp/registry";

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
  const slugs = new Set(getAllServers().map((s) => s.slug));
  return Array.from(slugs, (slug) => ({
    params: { id: slug },
    props: { server: getServerBySlug(slug)! },
  }));
}
