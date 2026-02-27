import { getServerCount } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "getmcp — Install MCP Servers in 19 AI Apps";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const serverCount = getServerCount();
  const appCount = getAppIds().length;

  return createOGImage({
    heading: [
      <span key="heading-1">Install MCP Servers</span>,
      <span key="heading-2">in {appCount} AI Apps</span>,
    ],
    description: `One command. ${serverCount}+ servers. Configs for JSON, JSONC, YAML, and TOML — generated for every app automatically.`,
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
