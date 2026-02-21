import type { MetadataRoute } from "next";
import { getAllServers } from "@getmcp/registry";

const BASE_URL = "https://getmcp.es";

export default function sitemap(): MetadataRoute.Sitemap {
  const servers = getAllServers();

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...servers.map((server) => ({
      url: `${BASE_URL}/servers/${server.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
