import { getServerCount, getServersByCategory } from "@getmcp/registry";
import { createOGImage } from "@/lib/og-image";
import { CATEGORY_NAMES } from "@/lib/categories";
import { GUIDES } from "@/lib/guide-data";
import { APP_COUNT } from "@/lib/constants";

/*
 * OG images for the non-server routes. Each entry holds the image `alt` text and a
 * renderer, so pages and endpoints share a single source of truth.
 */

export const HOME_OG = {
  alt: `getmcp — Install MCP Servers in ${APP_COUNT} AI Apps`,
  render() {
    const serverCount = getServerCount();

    return createOGImage({
      heading: [
        <span key="heading-1">Install MCP Servers</span>,
        <span key="heading-2">in {APP_COUNT} AI Apps</span>,
      ],
      description: `One command. ${serverCount}+ servers. Configs for JSON, JSONC, YAML, and TOML — generated for every app automatically.`,
      pills: [
        "Claude Desktop",
        "VS Code",
        "Cursor",
        "Windsurf",
        "Goose",
        "Zed",
        `+${APP_COUNT - 6} more`,
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
      description: `Browse and install ${count}+ MCP servers for ${APP_COUNT} AI applications with one command.`,
      pills: ["Claude Desktop", "VS Code", "Cursor", "Windsurf", `+${APP_COUNT - 4} more`],
    });
  },
};

export const GUIDES_OG = {
  alt: "getmcp — MCP Setup Guides",
  render() {
    return createOGImage({
      heading: [<span key="heading-1">MCP Setup Guides</span>],
      description: `Step-by-step guides to install and configure MCP servers in ${APP_COUNT} AI applications.`,
      pills: ["Claude Desktop", "VS Code", "Cursor", "Windsurf", `+${APP_COUNT - 4} more`],
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
      description: `Browse and install ${count} ${name.toLowerCase()} MCP servers across ${APP_COUNT} AI apps.`,
      pills: [name],
    });
  },
};

export const GUIDE_OG = {
  alt: "getmcp — MCP Setup Guide",
  render(app: string) {
    const guide = GUIDES[app];
    const name = guide ? (guide.shortName ?? guide.name) : app;

    return createOGImage({
      heading: [<span key="1">MCP Setup Guide</span>, <span key="2">for {name}</span>],
      description: `Step-by-step guide to install and configure MCP servers in ${name}.`,
      pills: [name, "MCP", "Setup Guide"],
    });
  },
};
