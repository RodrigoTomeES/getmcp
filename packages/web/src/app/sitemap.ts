import type { MetadataRoute } from "next";
import { getAllServers, getCategories } from "@getmcp/registry";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import { SITE_URL } from "@/lib/constants";
const BUILD_DATE = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const servers = getAllServers();
  const categories = getCategories();

  return [
    {
      url: SITE_URL,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/servers`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...categories.map((cat) => ({
      url: `${SITE_URL}/category/${cat}`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: `${SITE_URL}/guides`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...GUIDE_SLUGS.map((app) => ({
      url: `${SITE_URL}/guides/${app}`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...servers.map((server) => ({
      url: `${SITE_URL}/servers/${server.slug}`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
