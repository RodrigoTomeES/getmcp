/**
 * Guide data for the /guides/[app] pages.
 *
 * All config paths, formats, and root keys are derived directly from the
 * generator source files (packages/generators/src/<app>.ts) to ensure accuracy.
 */

export type GuideData = {
  name: string;
  slug: string;
  /** Human-readable format label (e.g. "JSON", "YAML") */
  format: string;
  /** The root key used in the config file (e.g. "mcpServers", "servers") */
  rootKey: string;
  configPaths: {
    /** Project-scoped path (relative to project root), if supported */
    project?: string;
    /** Global config path on macOS / Linux */
    macos?: string;
    /** Global config path on Windows */
    windows?: string;
    /** Global config path on Linux (when different from macOS) */
    linux?: string;
  };
  /** 100-150 word overview of the app and its MCP support */
  overview: string;
  /** Ordered list of things to have installed before starting */
  prerequisites: string[];
  /** Common issues users encounter and how to fix them */
  troubleshooting: string[];
  /** Server IDs from the registry that are popular with this app */
  popularServers: string[];
};

export const GUIDE_SLUGS: string[] = ["claude-desktop", "vscode", "cursor", "windsurf", "goose"];

export const GUIDES: Record<string, GuideData> = {
  "claude-desktop": {
    name: "Claude Desktop",
    slug: "claude-desktop",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/Library/Application Support/Claude/claude_desktop_config.json",
      windows: "%AppData%\\Claude\\claude_desktop_config.json",
      linux: "~/.config/Claude/claude_desktop_config.json",
    },
    overview:
      "Claude Desktop is Anthropic's flagship desktop application for interacting with Claude. It was the first major AI app to support the Model Context Protocol, making it the reference implementation for MCP configuration. Claude Desktop uses a straightforward JSON config file with an mcpServers root key — the canonical format that most other apps are modeled on. Servers run as local stdio processes or connect to remote HTTP/SSE endpoints. Once a server is added to the config and Claude Desktop is restarted, Claude gains access to the server's tools and resources directly in the conversation. The getmcp CLI detects Claude Desktop automatically and merges servers into the existing config without overwriting your current settings.",
    prerequisites: [
      "Claude Desktop installed (download from claude.ai/download)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Server not appearing after installation: Fully quit and relaunch Claude Desktop — it reads the config file only on startup. Use Cmd+Q (macOS) or File > Quit (Windows), not just closing the window.",
      "Config file not found: Claude Desktop creates the config file only after it has been launched at least once. Run Claude Desktop, then try adding the server.",
      "Permission denied errors on macOS: Check that the Node.js or Python binary has execute permission and is accessible from the PATH that Claude Desktop uses. Running `which node` in a terminal should show the correct binary.",
      "Environment variables not resolving: Variables in the env block must be string literals — they are not interpolated from your shell environment. Set them explicitly in the config or use the getmcp CLI which prompts for values.",
      "Server crashes immediately: Check the Claude Desktop logs at ~/Library/Logs/Claude/ (macOS) or %AppData%\\Claude\\logs\\ (Windows) for the server's stderr output.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "slack", "sequential-thinking"],
  },

  vscode: {
    name: "VS Code / GitHub Copilot",
    slug: "vscode",
    format: "JSON",
    rootKey: "servers",
    configPaths: {
      project: ".vscode/mcp.json",
    },
    overview:
      "VS Code added MCP support through GitHub Copilot Chat, allowing Copilot to call tools from MCP servers during conversations. The config file lives at .vscode/mcp.json inside your workspace, making it straightforward to check into source control and share with your team. VS Code differs from other apps in two key ways: it uses a servers root key instead of mcpServers, and every server entry requires an explicit type field (stdio, http, or sse). When using HTTP transport, VS Code maps the streamable-http type to http. The getmcp CLI generates the correct format automatically, adding the type field and renaming the root key so you never have to remember the differences.",
    prerequisites: [
      "VS Code 1.99 or higher",
      "GitHub Copilot extension installed and signed in",
      "Node.js 18 or higher for running npx-based servers",
      "A GitHub Copilot subscription (Individual, Business, or Enterprise)",
    ],
    troubleshooting: [
      "MCP option not visible in Copilot Chat: Ensure VS Code is at version 1.99+. Check Help > About to verify. Update if needed.",
      "Server type field is required: Unlike Claude Desktop, VS Code requires an explicit type on every server entry. The getmcp CLI adds this automatically; if editing manually, set type to stdio, http, or sse.",
      "Workspace trust blocking the config: VS Code may not load .vscode/mcp.json in untrusted workspaces. Open the Trust workspace dialog or mark the folder as trusted.",
      "streamable-http transport not recognized: VS Code uses http as the type value for what getmcp calls streamable-http. The CLI handles this mapping automatically.",
      "Server tools not appearing in Copilot Chat: Open the Copilot Chat panel, click the tools icon, and verify the server is listed and enabled. Reload the VS Code window if the server was just added.",
    ],
    popularServers: ["github", "playwright", "postgres", "filesystem", "docker"],
  },

  cursor: {
    name: "Cursor",
    slug: "cursor",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      project: ".cursor/mcp.json",
      macos: "~/.cursor/mcp.json",
      windows: "%UserProfile%\\.cursor\\mcp.json",
      linux: "~/.cursor/mcp.json",
    },
    overview:
      "Cursor is an AI-powered code editor built on VS Code with deep AI integration. It supports MCP servers using the same JSON format as Claude Desktop — an mcpServers root key with stdio and remote server configs — making it one of the easiest apps to migrate between. Cursor supports both a global config at ~/.cursor/mcp.json for servers available across all projects, and a project-level config at .cursor/mcp.json for workspace-specific servers. Project configs take precedence and can be checked into source control. When Cursor detects an MCP server, its AI features (Composer, Chat) can call the server's tools to perform actions like reading files, querying databases, or running searches.",
    prerequisites: [
      "Cursor IDE installed (download from cursor.com)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Server not appearing in Cursor: Restart Cursor after editing the config file. Cursor reads the MCP config on startup.",
      "Project vs global config conflict: If the same server name exists in both .cursor/mcp.json and ~/.cursor/mcp.json, the project-level config takes precedence.",
      "Error: spawn npx ENOENT: Cursor may not inherit your shell's PATH. Specify the full path to node or npx, or set it in the env block of the server config.",
      "MCP tools not available in Composer: Open Cursor Settings, go to Features > MCP, and verify the server status shows a green indicator. Toggle the server off and on to force a reconnect.",
      "Rate limits from the AI model: MCP tool calls count toward your Cursor AI usage. If you hit limits, check your Cursor subscription and usage dashboard.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  windsurf: {
    name: "Windsurf",
    slug: "windsurf",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/.codeium/windsurf/mcp_config.json",
      windows: "%UserProfile%\\.codeium\\windsurf\\mcp_config.json",
      linux: "~/.codeium/windsurf/mcp_config.json",
    },
    overview:
      "Windsurf is an AI-first code editor developed by Codeium, featuring the Cascade AI agent with deep agentic capabilities. It supports MCP servers through a global config file at ~/.codeium/windsurf/mcp_config.json. Windsurf uses the mcpServers root key like Claude Desktop, but has one notable difference for remote servers: it uses serverUrl instead of url to specify the endpoint. Stdio servers work identically to the canonical format. Windsurf also supports ${env:VARIABLE_NAME} interpolation syntax in config values, and includes an MCP Marketplace where servers can be discovered. The getmcp CLI handles the serverUrl mapping automatically when generating configs for Windsurf.",
    prerequisites: [
      "Windsurf installed (download from windsurf.com)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Config file not found: Windsurf creates the ~/.codeium/windsurf/ directory on first launch. Open Windsurf at least once before attempting to add MCP servers.",
      "Remote server not connecting: Windsurf uses serverUrl (not url) for remote servers. If editing the config manually, make sure to use serverUrl. The getmcp CLI handles this automatically.",
      "Server fails to start: Open Windsurf's output panel (View > Output) and select the MCP channel to see server error logs.",
      "Environment variable interpolation: Windsurf supports ${env:VARIABLE_NAME} syntax in config values, which reads from your system environment. This is different from the env block which sets variables for the server process.",
      "MCP not available in Cascade: MCP support is available in Windsurf 1.0+. Check Help > About Windsurf and update if you are on an older version.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "postgres", "playwright"],
  },

  goose: {
    name: "Goose",
    slug: "goose",
    format: "YAML",
    rootKey: "extensions",
    configPaths: {
      macos: "~/.config/goose/config.yaml",
      windows: "%AppData%\\goose\\config.yaml",
      linux: "~/.config/goose/config.yaml",
    },
    overview:
      "Goose is Block's open-source autonomous AI coding agent that runs in the terminal and can take multi-step actions. Its MCP support is unique among popular AI apps: it uses YAML format instead of JSON, and has its own field naming conventions. The root key is extensions (not mcpServers), command becomes cmd, and env becomes envs. Timeout values are in seconds rather than milliseconds. Remote servers use uri instead of url. Each extension also gets an enabled flag and a name display field. Despite these differences, getmcp handles all the transformations automatically — you describe the server in canonical format and the Goose generator produces correct YAML.",
    prerequisites: [
      "Goose CLI installed (see block.github.io/goose for installation instructions)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers (uvx-based servers)",
    ],
    troubleshooting: [
      "Config file not found: Goose creates ~/.config/goose/config.yaml on first run. Launch goose at least once before adding servers.",
      "YAML parse error after manual edit: YAML is whitespace-sensitive. Use a YAML validator or let getmcp write the config — it uses the yaml library to ensure correct formatting.",
      "Extension not loading: Run goose with verbose output (GOOSE_LOG_LEVEL=debug goose) to see extension loading errors in the output.",
      "cmd field vs command: Goose uses cmd, not command. If you manually copy a config from another app, rename the field. The getmcp CLI handles this automatically.",
      "Timeout unit mismatch: Goose expects timeout in seconds, not milliseconds. The getmcp generator converts automatically (dividing by 1000 and rounding up), but manual edits need to use the correct unit.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "docker", "slack"],
  },
};
