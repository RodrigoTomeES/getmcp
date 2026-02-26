import type { MetadataRoute } from "next";
import { getAllServers } from "@getmcp/registry";

const BASE_URL = "https://getmcp.es";
const BUILD_DATE = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const servers = getAllServers();

  return [
    {
      url: BASE_URL,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...servers.map((server) => ({
      url: `${BASE_URL}/servers/${server.id}`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
