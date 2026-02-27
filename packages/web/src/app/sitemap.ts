import type { MetadataRoute } from "next";
import { getAllServers, getCategories } from "@getmcp/registry";

const BASE_URL = "https://getmcp.es";
const BUILD_DATE = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const servers = getAllServers();
  const categories = getCategories();

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
    {
      url: `${BASE_URL}/servers`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...categories.map((cat) => ({
      url: `${BASE_URL}/category/${cat}`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...servers.map((server) => ({
      url: `${BASE_URL}/servers/${server.id}`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
