import { createOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "getmcp — MCP Setup Guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const GUIDE_NAMES: Record<string, string> = {
  "claude-desktop": "Claude Desktop",
  vscode: "VS Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  goose: "Goose",
  "claude-code": "Claude Code",
  cline: "Cline",
  "roo-code": "Roo Code",
  opencode: "OpenCode",
  zed: "Zed",
  pycharm: "PyCharm",
  codex: "Codex",
  "gemini-cli": "Gemini CLI",
  continue: "Continue",
  "amazon-q": "Amazon Q Developer",
  trae: "Trae",
  "bolt-ai": "BoltAI",
  "libre-chat": "LibreChat",
  antigravity: "Antigravity",
};

export function generateStaticParams() {
  return Object.keys(GUIDE_NAMES).map((app) => ({ app }));
}

export default async function Image({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const name = GUIDE_NAMES[app] ?? app;

  return createOGImage({
    heading: [<span key="1">MCP Setup Guide</span>, <span key="2">for {name}</span>],
    description: `Step-by-step guide to install and configure MCP servers in ${name}.`,
    pills: [name, "MCP", "Setup Guide"],
  });
}
