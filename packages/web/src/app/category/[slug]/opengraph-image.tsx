import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { getCategories, getServersByCategory } from "@getmcp/registry";

export const alt = "getmcp — MCP Server Category";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getCategories().map((cat) => ({ slug: cat }));
}

const CATEGORY_NAMES: Record<string, string> = {
  "developer-tools": "Developer Tools",
  web: "Web",
  automation: "Automation",
  data: "Data",
  search: "Search",
  ai: "AI",
  cloud: "Cloud",
  communication: "Communication",
  design: "Design",
  documentation: "Documentation",
  devops: "DevOps",
  utilities: "Utilities",
  security: "Security",
  gaming: "Gaming",
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = CATEGORY_NAMES[slug] ?? slug;
  const count = getServersByCategory(slug).length;

  return createOGImage({
    heading: [<span key="1">{name} MCP Servers</span>],
    description: `Browse and install ${count} ${name.toLowerCase()} MCP servers across 19 AI apps.`,
    pills: [name],
  });
}
