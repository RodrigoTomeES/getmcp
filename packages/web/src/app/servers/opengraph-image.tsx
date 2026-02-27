import { getServerCount } from "@getmcp/registry";
import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "getmcp — MCP Server Directory";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const count = getServerCount();

  return createOGImage({
    heading: [<span key="heading-1">MCP Server Directory</span>],
    description: `Browse and install ${count}+ MCP servers for 19 AI applications with one command.`,
    pills: ["Claude Desktop", "VS Code", "Cursor", "Windsurf", "+15 more"],
  });
}
