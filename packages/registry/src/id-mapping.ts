/**
 * ID slug generation from official MCP registry names.
 * Transforms reverse-DNS names (e.g. "io.github.getsentry/sentry-mcp")
 * into URL-friendly slugs (e.g. "sentry").
 */

/** Suffixes to strip from slug candidates (in priority order) */
const STRIP_SUFFIXES = ["-mcp-server", "-mcp", "-server"];

/** Manual overrides for edge cases where auto-generation fails */
const MANUAL_OVERRIDES: Record<string, string> = {};

/**
 * Generate a slug from an official reverse-DNS name.
 * Strategy:
 * 1. Check manual overrides
 * 2. Extract last segment after "/"
 * 3. Strip common suffixes (-mcp-server, -mcp, -server)
 * 4. Lowercase and sanitize
 */
export function generateSlug(officialName: string): string {
  if (MANUAL_OVERRIDES[officialName]) {
    return MANUAL_OVERRIDES[officialName];
  }

  // Extract the last segment after "/"
  const parts = officialName.split("/");
  let slug = parts[parts.length - 1];

  // Lowercase
  slug = slug.toLowerCase();

  // Strip common suffixes
  for (const suffix of STRIP_SUFFIXES) {
    if (slug.endsWith(suffix) && slug.length > suffix.length) {
      slug = slug.slice(0, -suffix.length);
      break;
    }
  }

  // Sanitize: only allow lowercase alphanumeric and hyphens
  slug = slug
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug;
}

/**
 * Extract the org/namespace from an official reverse-DNS name.
 * "io.github.getsentry/sentry-mcp" -> "getsentry"
 */
export function extractOrg(officialName: string): string {
  const parts = officialName.split("/");
  if (parts.length < 2) return "";

  const namespace = parts[0];
  const repoSegment = parts[parts.length - 1].toLowerCase();
  const segments = namespace.split(".");

  // Walk backwards, skip segments matching the repo name to find the real org
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i].toLowerCase() !== repoSegment) {
      return segments[i];
    }
  }
  return segments[segments.length - 1];
}

/**
 * Resolve slug collisions by prefixing with org name.
 * Takes a map of officialName -> slug and returns a resolved map
 * where collisions are fixed by prefixing with the org name.
 */
export function resolveCollisions(
  entries: Array<{ officialName: string; slug: string }>,
): Map<string, string> {
  const result = new Map<string, string>();

  // Group by slug to find collisions
  const slugGroups = new Map<string, Array<{ officialName: string; slug: string }>>();
  for (const entry of entries) {
    const existing = slugGroups.get(entry.slug) ?? [];
    existing.push(entry);
    slugGroups.set(entry.slug, existing);
  }

  for (const [slug, group] of slugGroups) {
    if (group.length === 1) {
      result.set(group[0].officialName, slug);
    } else {
      // Collision — prefix each with org name
      for (const entry of group) {
        const org = extractOrg(entry.officialName).toLowerCase();
        const prefixed = org ? `${org}-${slug}` : `${slug}-${group.indexOf(entry)}`;
        result.set(entry.officialName, prefixed);
      }
    }
  }

  return result;
}

/**
 * Generate slugs for all entries with collision resolution.
 */
export function generateSlugs(officialNames: string[]): Map<string, string> {
  const entries = officialNames.map((name) => ({
    officialName: name,
    slug: generateSlug(name),
  }));

  return resolveCollisions(entries);
}
