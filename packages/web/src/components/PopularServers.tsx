import Link from "next/link";
import { getOfficialServers, getServerMetrics } from "@getmcp/registry";
import { ServerCard, type ServerCardData } from "./ServerCard";

export function PopularServers() {
  const servers = getOfficialServers()
    .map((s) => {
      const metrics = getServerMetrics(s.id);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        categories: s.categories as string[],
        runtime: s.runtime as string | undefined,
        isRemote: "url" in s.config,
        envCount: s.requiredEnvVars.length,
        stars: metrics?.github?.stars,
        downloads: metrics?.npm?.weeklyDownloads,
        isOfficial: s.isOfficial || false,
      };
    })
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, 6) satisfies ServerCardData[];

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold">Popular Official Servers</h2>
        <Link href="/servers" className="text-sm text-accent hover:underline transition-colors">
          Browse all servers &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
    </section>
  );
}
