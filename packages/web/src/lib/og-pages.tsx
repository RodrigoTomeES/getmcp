import { getServerCount, getServersByCategory } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { createOGImage } from "@/lib/og-image";
import { CATEGORY_NAMES } from "@/lib/categories";

/*
 * OG images for the non-server routes (ported 1:1 from the Next.js
 * `opengraph-image.tsx` files). Each entry holds the image `alt` text and a
 * renderer, so pages and endpoints share a single source of truth.
 */

export const HOME_OG = {
  alt: "getmcp — Install MCP Servers in 19 AI Apps",
  render() {
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
  },
};

export const SERVERS_OG = {
  alt: "getmcp — MCP Server Directory",
  render() {
    const count = getServerCount();

    return createOGImage({
      heading: [<span key="heading-1">MCP Server Directory</span>],
      description: `Browse and install ${count}+ MCP servers for 19 AI applications with one command.`,
      pills: ["Claude Desktop", "VS Code", "Cursor", "Windsurf", "+15 more"],
    });
  },
};

export const GUIDES_OG = {
  alt: "getmcp — MCP Setup Guides",
  render() {
    return createOGImage({
      heading: [<span key="heading-1">MCP Setup Guides</span>],
      description:
        "Step-by-step guides to install and configure MCP servers in 19 AI applications.",
      pills: ["Claude Desktop", "VS Code", "Cursor", "Windsurf", "+15 more"],
    });
  },
};

export const DOCS_OG = {
  alt: "Documentation — getmcp",
  render() {
    return createOGImage({
      heading: "Documentation",
      description:
        "Learn how to install, configure, and use getmcp to manage MCP servers across all AI applications.",
      pills: ["Getting Started", "Supported Apps", "Library Usage", "Contributing"],
    });
  },
};

export const CATEGORY_OG = {
  alt: "getmcp — MCP Server Category",
  render(slug: string) {
    const name = CATEGORY_NAMES[slug] ?? slug;
    const count = getServersByCategory(slug).length;

    return createOGImage({
      heading: [<span key="1">{name} MCP Servers</span>],
      description: `Browse and install ${count} ${name.toLowerCase()} MCP servers across 19 AI apps.`,
      pills: [name],
    });
  },
};

/** Short app names used in guide OG images (differs from APP_LABELS for VS Code). */
export const GUIDE_NAMES: Record<string, string> = {
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

export const GUIDE_OG = {
  alt: "getmcp — MCP Setup Guide",
  render(app: string) {
    const name = GUIDE_NAMES[app] ?? app;

    return createOGImage({
      heading: [<span key="1">MCP Setup Guide</span>, <span key="2">for {name}</span>],
      description: `Step-by-step guide to install and configure MCP servers in ${name}.`,
      pills: [name, "MCP", "Setup Guide"],
    });
  },
};
