import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "Documentation — getmcp";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return createOGImage({
    heading: "Documentation",
    description:
      "Learn how to install, configure, and use getmcp to manage MCP servers across all AI applications.",
    pills: ["Getting Started", "Supported Apps", "Library Usage", "Contributing"],
  });
}
