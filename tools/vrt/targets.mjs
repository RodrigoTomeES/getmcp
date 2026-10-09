// Pages and viewports captured by capture.mjs. The server slugs are representative
// cases (official/Docker, many env vars, remote with headers, remote, minimal, with icon)
// and are always included in partial builds (REPRESENTATIVE_SLUGS in
// packages/web/src/lib/server-paths.ts).
export const GUIDES = [
  "claude-desktop",
  "vscode",
  "cursor",
  "windsurf",
  "goose",
  "claude-code",
  "cline",
  "roo-code",
  "opencode",
  "zed",
  "pycharm",
  "codex",
  "gemini-cli",
  "continue",
  "amazon-q",
  "trae",
  "bolt-ai",
  "libre-chat",
  "antigravity",
];
export const CATEGORIES = [
  "ai",
  "automation",
  "cloud",
  "communication",
  "data",
  "design",
  "developer-tools",
  "devops",
  "documentation",
  "gaming",
  "search",
  "security",
  "utilities",
  "web",
];
export const SERVERS = [
  "github-github",
  "data-prism",
  "pg-aiguide",
  "apify-apify",
  "sh-mcp",
  "pretrip",
  "bev-door",
];

export const TARGETS = [
  "/",
  "/servers",
  "/docs",
  "/guides",
  "/this-page-does-not-exist-vrt",
  ...SERVERS.map((s) => `/servers/${s}`),
  ...CATEGORIES.map((c) => `/category/${c}`),
  ...GUIDES.map((g) => `/guides/${g}`),
];

export const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
};

/** File stem for a path: "/" -> "home", "/servers/x" -> "servers__x". */
export const fileStem = (p) => (p === "/" ? "home" : p.slice(1).replace(/\//g, "__"));
