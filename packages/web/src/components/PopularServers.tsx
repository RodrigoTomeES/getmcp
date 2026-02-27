import Link from "next/link";
import { getServer } from "@getmcp/registry";
import { ServerCard, type ServerCardData } from "./ServerCard";

const POPULAR_IDS = [
  "github",
  "playwright",
  "postgres",
  "slack",
  "docker",
  "brave-search",
  "notion",
  "stripe",
  "figma",
  "sentry",
  "supabase",
  "filesystem",
];

export function PopularServers() {
  const servers: ServerCardData[] = POPULAR_IDS.flatMap((id) => {
    const s = getServer(id);
    if (!s) return [];
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      categories: s.categories as string[],
      runtime: s.runtime as string | undefined,
      isRemote: "url" in s.config,
      envCount: s.requiredEnvVars.length,
    };
  });

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold">Popular Servers</h2>
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
