import { getServerCount } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "getmcp — Universal MCP Server Directory";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const serverCount = getServerCount();
  const appCount = getAppIds().length;

  return createOGImage({
    heading: [
      <span key="heading-1">Universal MCP</span>,
      <span key="heading-2">Server Directory</span>,
    ],
    description: `Browse ${serverCount} MCP servers. One config format, generated for ${appCount} applications.`,
    pills: [
      "Claude Desktop",
      "VS Code",
      "Cursor",
      "Windsurf",
      "Goose",
      "Zed",
      `+${appCount - 6} more`,
    ],
  });
}
