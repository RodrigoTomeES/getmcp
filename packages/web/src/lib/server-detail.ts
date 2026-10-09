import { getAllServers, getServerMetrics } from "@getmcp/registry";
import type { InternalRegistryEntry } from "@getmcp/registry";
import { generators } from "@getmcp/generators";
import type { AppIdType } from "@getmcp/core";

/**
 * Data for one server card, rendered by `ServerCard.astro` (static pages) and
 * `ServerCard.tsx` (the `/servers` SearchBar island). Client code imports it
 * type-only so this module stays out of the client bundle.
 */
export type ServerCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categories?: string[];
  runtime?: string;
  isRemote: boolean;
  envCount: number;
  stars?: number;
  downloads?: number;
  isOfficial?: boolean;
};

/** One app's config snippet for a server, rendered by `ConfigViewer.astro`. */
export type PreGeneratedConfig = {
  serialized: string;
  configPath: string;
  format: string;
  docsUrl: string;
};

const RELATED_LIMIT = 4;

export function preGenerateConfigs(
  serverId: string,
  config: InternalRegistryEntry["config"],
): Record<string, PreGeneratedConfig> {
  const appIds = Object.keys(generators) as AppIdType[];
  return Object.fromEntries(
    appIds.map((appId) => {
      const gen = generators[appId];
      const generated = gen.generate(serverId, config);
      return [
        appId,
        {
          serialized: gen.serialize(generated),
          configPath:
            gen.app.configPaths !== null && gen.app.globalConfigPaths !== null
              ? `${gen.app.configPaths} (project) or ${gen.app.globalConfigPaths?.darwin ?? "—"} (global)`
              : (gen.app.configPaths ??
                gen.app.globalConfigPaths?.darwin ??
                gen.app.globalConfigPaths?.win32 ??
                gen.app.globalConfigPaths?.linux ??
                "—"),
          format: gen.app.configFormat.toUpperCase(),
          docsUrl: gen.app.docsUrl,
        },
      ];
    }),
  );
}

export function runtimeToRequirements(runtime?: string): string {
  const map: Record<string, string> = {
    node: "Node.js 18+",
    docker: "Docker Engine",
    python: "Python 3.10+",
    binary: "Pre-built binary",
  };
  return runtime ? (map[runtime] ?? runtime) : "Node.js 18+";
}

export function toServerCardData(s: InternalRegistryEntry): ServerCardData {
  const m = getServerMetrics(s.id);
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    categories: s.categories,
    runtime: s.runtime,
    isRemote: "url" in s.config,
    envCount: s.requiredEnvVars.length,
    stars: m?.github?.stars,
    downloads: m?.npm?.weeklyDownloads ?? m?.pypi?.weeklyDownloads,
    isOfficial: s.isOfficial,
  };
}

/**
 * First `RELATED_LIMIT + 1` servers per category, in `getAllServers()` order.
 * Built once per build because scanning all ~38k servers for every page would
 * be quadratic. The extra entry lets the current server be excluded and still
 * leave `RELATED_LIMIT` results.
 */
let categoryIndex: Map<string, InternalRegistryEntry[]> | undefined;

function getCategoryIndex(): Map<string, InternalRegistryEntry[]> {
  if (!categoryIndex) {
    categoryIndex = new Map();
    for (const s of getAllServers()) {
      for (const cat of s.categories ?? []) {
        const list = categoryIndex.get(cat) ?? [];
        if (list.length <= RELATED_LIMIT && !list.includes(s)) {
          list.push(s);
          categoryIndex.set(cat, list);
        }
      }
    }
  }
  return categoryIndex;
}

/**
 * Up to 4 other servers sharing the primary category, matching the previous
 * `getAllServers().filter(...).slice(0, 4)` behavior.
 */
export function getRelatedServers(server: InternalRegistryEntry): ServerCardData[] {
  const primaryCategory = server.categories?.[0];
  if (!primaryCategory) return [];
  return (getCategoryIndex().get(primaryCategory) ?? [])
    .filter((s) => s.id !== server.id)
    .slice(0, RELATED_LIMIT)
    .map(toServerCardData);
}
