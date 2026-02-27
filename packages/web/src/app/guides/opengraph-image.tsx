import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "getmcp — MCP Setup Guides";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return createOGImage({
    heading: [<span key="heading-1">MCP Setup Guides</span>],
    description: "Step-by-step guides to install and configure MCP servers in 19 AI applications.",
    pills: ["Claude Desktop", "VS Code", "Cursor", "Windsurf", "+15 more"],
  });
}
