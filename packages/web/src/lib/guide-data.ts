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

export const GUIDE_SLUGS: string[] = [
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

  "claude-code": {
    name: "Claude Code",
    slug: "claude-code",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      project: ".mcp.json",
      macos: "~/.claude.json",
      windows: "%UserProfile%\\.claude.json",
      linux: "~/.claude.json",
    },
    overview:
      "Claude Code is Anthropic's CLI-based agentic coding tool that runs in the terminal and can autonomously read, write, and execute code. It supports MCP servers through a format nearly identical to Claude Desktop — an mcpServers root key with the same stdio and remote server structure. The main difference is that remote servers use a type field instead of transport to specify the connection protocol. Claude Code supports both project-level config at .mcp.json (checked into source control alongside your code) and a global user config at ~/.claude.json for servers available across all projects. The getmcp CLI auto-detects Claude Code if the ~/.claude directory exists and handles the minor format differences automatically.",
    prerequisites: [
      "Claude Code CLI installed (npm install -g @anthropic-ai/claude-code)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Server not loading after adding config: Claude Code reads .mcp.json on each session start. Exit the current session and start a new one with `claude` to pick up changes.",
      "Project config vs global config: If .mcp.json exists in the current directory, it is used for project-scoped servers. The global ~/.claude.json holds user-wide servers. Both are active simultaneously.",
      "type field for remote servers: Claude Code uses type (not transport) to identify the remote protocol. Valid values are http, streamable-http, and sse. The getmcp CLI writes the correct field automatically.",
      "Permission prompts on first use: Claude Code may prompt you to confirm allowing a new MCP server tool. This is a one-time security prompt per server per project.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  cline: {
    name: "Cline",
    slug: "cline",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos:
        "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      windows:
        "%AppData%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json",
      linux:
        "~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    },
    overview:
      "Cline is a popular AI coding assistant VS Code extension that integrates Claude and other models directly into your editor. It stores its MCP server config in VS Code's global extension storage rather than a workspace file, meaning servers are available across all your projects. Cline extends the standard mcpServers format by adding two fields to every server entry: alwaysAllow (an array of tool names that can run without confirmation) and disabled (a boolean to temporarily pause a server without removing it). These extra fields are managed by Cline's settings UI and should not be removed manually. The getmcp CLI adds sensible defaults — alwaysAllow: [] and disabled: false — when generating configs for Cline.",
    prerequisites: [
      "VS Code installed (version 1.85 or higher recommended)",
      "Cline extension installed from the VS Code Marketplace (saoudrizwan.claude-dev)",
      "An AI model API key configured in Cline settings (Anthropic, OpenAI, etc.)",
      "Node.js 18 or higher for running npx-based servers",
    ],
    troubleshooting: [
      "Config file not found: Cline creates its config directory only after the extension is installed and VS Code has been opened at least once. Install Cline, restart VS Code, then try adding servers.",
      "Server shows as disabled: Check the disabled field in the config — Cline's UI may have toggled it off. Set it to false or use the Cline UI to re-enable the server.",
      "alwaysAllow not persisting: Cline manages the alwaysAllow list through its own UI. After adding a server with getmcp, open the Cline MCP settings panel to configure which tools are pre-approved.",
      "Extension ID changed: If you see errors about the extension path, verify the extension is still published under saoudrizwan.claude-dev. The config path includes the extension ID.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "postgres", "playwright"],
  },

  "roo-code": {
    name: "Roo Code",
    slug: "roo-code",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos:
        "~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json",
      windows:
        "%AppData%\\Code\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\mcp_settings.json",
      linux:
        "~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json",
    },
    overview:
      "Roo Code (formerly Roo Cline) is an AI coding assistant VS Code extension that evolved from the Cline codebase with additional features for autonomous task execution. Its MCP config format is very similar to Cline: it uses the mcpServers root key and adds alwaysAllow and disabled to each server entry. One notable difference for remote servers is that Roo Code requires an explicit type field and uses streamable-http where the canonical format uses http. Roo Code also supports additional server options like watchPaths and disabledTools for fine-grained control. The config lives in VS Code's extension storage for the rooveterinaryinc.roo-cline extension, separate from Cline's storage, so you can run both extensions with independent server lists.",
    prerequisites: [
      "VS Code installed (version 1.85 or higher recommended)",
      "Roo Code extension installed from the VS Code Marketplace (rooveterinaryinc.roo-cline)",
      "An AI model API key configured in Roo Code settings",
      "Node.js 18 or higher for running npx-based servers",
    ],
    troubleshooting: [
      "Config file not found: Roo Code creates its config directory after the first install and VS Code restart. Open VS Code with Roo Code installed, then add servers.",
      "Remote server type mismatch: Roo Code requires type: streamable-http for streamable HTTP servers — it does not accept the bare http value. The getmcp CLI handles this mapping; manual edits must use the correct value.",
      "Conflict with Cline: Roo Code and Cline store configs in separate directories (different extension IDs). Having both installed is fine, but you need to add servers to each separately.",
      "Server not appearing in the Roo Code panel: After editing the config file directly, use the Roo Code MCP settings panel in VS Code to reload. Sometimes a full VS Code window reload (Ctrl+Shift+P > Developer: Reload Window) is needed.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  opencode: {
    name: "OpenCode",
    slug: "opencode",
    format: "JSONC",
    rootKey: "mcp",
    configPaths: {
      project: "opencode.json",
    },
    overview:
      "OpenCode is an open-source AI coding agent by Anomaly that runs in the terminal with support for multiple AI models. Its MCP configuration differs from the canonical format in several meaningful ways: the root key is mcp instead of mcpServers, stdio servers use an array-format command that merges the command binary and all its arguments into a single list, and environment variables go in an environment field instead of env. Each server also requires an explicit type field (local for stdio servers, remote for HTTP). OpenCode uses JSONC format (JSON with comments), allowing you to annotate your config. Project-level configuration lives in opencode.json at the repository root and can be committed to version control.",
    prerequisites: [
      "OpenCode CLI installed (see opencode.ai for installation instructions)",
      "Node.js 18 or higher for running npx-based servers",
      "An AI model API key configured in OpenCode (e.g., ANTHROPIC_API_KEY, OPENAI_API_KEY)",
    ],
    troubleshooting: [
      'command must be an array: OpenCode does not accept a string command field. The entire invocation — binary and arguments — must be a JSON array such as ["npx", "-y", "@package/name"]. The getmcp CLI constructs this automatically.',
      "environment vs env: OpenCode uses environment for server-specific variables, not env. If you copy a config from another app, rename the field or the variables will be silently ignored.",
      "Config not found: OpenCode looks for opencode.json in the current working directory. Make sure you run opencode from the project root, or create the config file there.",
      "JSONC parse error: opencode.json supports JavaScript-style comments. If you get a parse error, check for trailing commas after the last item in an object or array — those are not valid even in JSONC.",
    ],
    popularServers: ["github", "filesystem", "postgres", "brave-search", "docker"],
  },

  zed: {
    name: "Zed",
    slug: "zed",
    format: "JSON",
    rootKey: "context_servers",
    configPaths: {
      macos: "~/.config/zed/settings.json",
      windows: "%AppData%\\Zed\\settings.json",
      linux: "~/.config/zed/settings.json",
    },
    overview:
      "Zed is a high-performance code editor built in Rust by Zed Industries, designed for speed and collaborative editing. Zed added MCP support through its context servers feature, which allows the AI assistant to call external tools during conversations. MCP servers are configured inside Zed's main settings.json under the context_servers root key — there is no separate config file. The server format is otherwise straightforward: stdio servers use command, args, and env in the standard structure. Remote servers use url and headers. Zed also supports installing servers via its extension marketplace for a more integrated experience. The getmcp CLI merges the context_servers section into your existing settings.json without touching any other Zed settings.",
    prerequisites: [
      "Zed editor installed (download from zed.dev)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "context_servers merged into settings.json: Zed stores all settings in a single file. The getmcp CLI adds the context_servers key without modifying other settings. If you manage settings manually, add the context_servers block at the top level of the JSON object.",
      "Server not available in AI assistant: After editing settings.json, open the Zed command palette (Cmd+Shift+P) and run Agent: Restart Language Servers or restart Zed to reload the context server list.",
      "settings.json parse error: Zed's settings.json is strict JSON (no comments, no trailing commas). If Zed shows a settings parse error after editing, use a JSON validator to find the syntax issue.",
      "Extension-based servers vs config-based servers: Some MCP servers are available as Zed extensions from the marketplace. These are installed differently from config-based servers and managed via Extensions > Installed. Both can be active at the same time.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "postgres", "sequential-thinking"],
  },

  pycharm: {
    name: "PyCharm",
    slug: "pycharm",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      project: ".ai/mcp/mcp.json",
    },
    overview:
      "PyCharm is JetBrains' Python IDE, and MCP support is provided through the JetBrains AI Assistant plugin. PyCharm uses a project-level config at .ai/mcp/mcp.json — the same canonical mcpServers format as Claude Desktop, making it a passthrough generator. This file can be committed to version control to share server configurations with your team. The AI Assistant integrates MCP tools into its inline AI chat and code generation features. Because the format is identical to the canonical format, any server that works with Claude Desktop will work with PyCharm without any changes. Note that PyCharm must be fully closed and reopened for config changes to take effect — unlike some tools, it does not hot-reload the MCP config.",
    prerequisites: [
      "PyCharm (Community or Professional) installed (download from jetbrains.com/pycharm)",
      "JetBrains AI Assistant plugin installed (Plugins > Marketplace > AI Assistant)",
      "An active JetBrains AI subscription or trial",
      "Node.js 18 or higher for running npx-based servers",
    ],
    troubleshooting: [
      "Config changes not taking effect: PyCharm reads .ai/mcp/mcp.json only on startup. Fully close PyCharm (File > Exit) and reopen it after making changes — there is no hot-reload for MCP config.",
      "AI Assistant plugin not installed: MCP support requires the JetBrains AI Assistant plugin. Go to Preferences > Plugins > Marketplace, search for AI Assistant, and install it. The plugin requires a JetBrains AI subscription.",
      "Config directory not created: PyCharm does not create .ai/mcp/ automatically. Create the directories and file manually, or use the getmcp CLI which creates them if they do not exist.",
      "MCP tools not appearing in AI chat: Ensure the AI Assistant plugin is enabled (not just installed) and that you are signed into a JetBrains account with an active AI subscription. Check Help > Diagnostic Tools > Show Log for plugin errors.",
    ],
    popularServers: ["github", "postgres", "filesystem", "docker", "sequential-thinking"],
  },

  codex: {
    name: "Codex",
    slug: "codex",
    format: "TOML",
    rootKey: "mcp_servers",
    configPaths: {
      project: ".codex/config.toml",
      macos: "~/.codex/config.toml",
      windows: "%UserProfile%\\.codex\\config.toml",
      linux: "~/.codex/config.toml",
    },
    overview:
      "Codex is OpenAI's AI coding agent that runs in the terminal, designed for autonomous software engineering tasks. It is the only major AI app in the getmcp ecosystem that uses TOML for its config format. MCP servers are configured under the mcp_servers root key (note the underscore, unlike mcpServers). Stdio servers use the standard command, args, and env fields. Remote servers use http_headers instead of headers, and timeout becomes startup_timeout_sec measured in seconds rather than milliseconds. Codex auto-detects the transport type from the URL, so no explicit transport field is needed. Both a global config at ~/.codex/config.toml and a project-level config at .codex/config.toml are supported. The getmcp CLI serializes the correct TOML structure automatically.",
    prerequisites: [
      "Codex CLI installed (npm install -g @openai/codex)",
      "An OpenAI API key set as OPENAI_API_KEY in your environment",
      "Node.js 18 or higher for running npx-based servers",
    ],
    troubleshooting: [
      "TOML syntax errors: TOML is whitespace-tolerant but has strict rules around section headers and value types. Use a TOML validator if you edit the config manually. The getmcp CLI uses the smol-toml library to produce valid TOML.",
      "mcp_servers vs mcpServers: Codex uses mcp_servers (with an underscore) as the root key, not mcpServers. Copying configs from other apps directly will not work — the key must be renamed.",
      "http_headers vs headers: Remote server configs use http_headers for custom HTTP headers, not headers. If a server requires authentication headers and they are not being sent, check that you are using the correct field name.",
      "startup_timeout_sec units: Codex measures timeout in seconds, not milliseconds. If you set a timeout manually, use seconds (e.g., 30 not 30000). The getmcp CLI converts automatically from the canonical millisecond value.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  "gemini-cli": {
    name: "Gemini CLI",
    slug: "gemini-cli",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/.gemini/settings.json",
      windows: "%UserProfile%\\.gemini\\settings.json",
      linux: "~/.gemini/settings.json",
    },
    overview:
      "Gemini CLI is Google's open-source AI agent for the terminal, powered by the Gemini model family. It reads MCP server configuration from ~/.gemini/settings.json using the standard mcpServers root key and the same field names as Claude Desktop, making it one of the most straightforward apps to configure. Servers declared in the config are available to Gemini CLI as tools it can invoke during multi-step agentic tasks — reading files, querying APIs, running searches, and more. Because the format is a near-passthrough of the canonical schema, configs can be copied directly from Claude Desktop with minimal or no changes. The getmcp CLI detects Gemini CLI automatically by checking for the ~/.gemini directory and merges server entries without touching your existing settings.",
    prerequisites: [
      "Gemini CLI installed (see github.com/google-gemini/gemini-cli for installation instructions)",
      "A Google account with Gemini API access or an API key",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Config file not found: Gemini CLI creates ~/.gemini/settings.json on first run. Launch gemini at least once before adding MCP servers.",
      "Server not available after editing the config: Gemini CLI reads settings.json at startup. Restart the CLI session after any config change.",
      "API key errors when running a server: The env block in the server config sets environment variables for the server process. Ensure the required API key is spelled correctly and is a non-empty string.",
      "Tool calls returning errors: Run Gemini CLI with the --debug flag to see detailed logs of MCP server communication and identify where the failure occurs.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  continue: {
    name: "Continue",
    slug: "continue",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/.continue/config.json",
      windows: "%UserProfile%\\.continue\\config.json",
      linux: "~/.continue/config.json",
    },
    overview:
      "Continue is a popular open-source AI code assistant that integrates as an extension into VS Code and JetBrains IDEs. It supports MCP servers through a global config file at ~/.continue/config.json, using the same mcpServers root key and field names as Claude Desktop. MCP servers registered in Continue become available as tools in the AI chat sidebar, enabling the assistant to query databases, search the web, read files, and perform other actions during code review and generation sessions. The config is shared across all workspaces and both VS Code and JetBrains, so servers configured once are available everywhere Continue is installed. The getmcp CLI detects Continue by checking for the ~/.continue directory.",
    prerequisites: [
      "Continue extension installed in VS Code or a JetBrains IDE (download from continue.dev)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Config file not found: Continue creates ~/.continue/config.json on first launch of the extension. Open your editor with Continue installed at least once before adding servers.",
      "Server not appearing in Continue's tool list: Reload the editor window after editing config.json. In VS Code, use Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux) and run Developer: Reload Window.",
      "MCP tools not triggering during chat: Continue must be configured to allow tool use. Check the Continue settings panel for the Allow Tools option and ensure it is enabled for your model provider.",
      "Server process fails to start: Continue inherits the editor's PATH, which may differ from your shell's PATH. Specify absolute paths to node or python binaries in the command field if you encounter spawn errors.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "postgres", "docker"],
  },

  "amazon-q": {
    name: "Amazon Q Developer",
    slug: "amazon-q",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/.aws/amazonq/mcp.json",
      windows: "%UserProfile%\\.aws\\amazonq\\mcp.json",
      linux: "~/.aws/amazonq/mcp.json",
    },
    overview:
      "Amazon Q Developer is AWS's AI coding assistant, available as a CLI tool and as IDE extensions for VS Code and JetBrains. The CLI variant reads MCP server configuration from ~/.aws/amazonq/mcp.json using the standard mcpServers root key, compatible with the canonical format used by Claude Desktop. MCP servers extend Amazon Q's capabilities within the terminal agent, enabling it to interact with external services, query databases, manage infrastructure, and perform multi-step development tasks. The config path sits within the existing ~/.aws directory, making it natural to manage alongside other AWS credentials and settings. The getmcp CLI detects Amazon Q by checking for the ~/.aws/amazonq directory.",
    prerequisites: [
      "Amazon Q Developer CLI installed (see docs.aws.amazon.com/amazonq for installation instructions)",
      "An AWS Builder ID or IAM Identity Center account for authentication",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Config directory not found: Amazon Q creates ~/.aws/amazonq/ after first login. Run q login and complete authentication before adding MCP servers.",
      "Server not available in Q chat: Restart the Amazon Q CLI session after editing mcp.json. The config is read at session startup.",
      "Authentication errors from MCP servers: API keys and tokens must be set as string values in the env block. They are not inherited from your AWS credentials file.",
      "Conflict with AWS CLI credentials: The ~/.aws/amazonq/ directory is separate from ~/.aws/credentials. MCP config changes do not affect your AWS CLI authentication.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "docker", "postgres"],
  },

  trae: {
    name: "Trae",
    slug: "trae",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      project: ".trae/mcp.json",
    },
    overview:
      "Trae is an AI-powered IDE developed by ByteDance that brings agentic coding capabilities to a VS Code-based environment. It uses project-scoped MCP configuration stored at .trae/mcp.json within the workspace root, using the standard mcpServers root key and the same field structure as Claude Desktop. Because the config is project-scoped, it can be committed to source control alongside your code, allowing teams to share a consistent set of MCP server tools. Trae's AI agent can call registered MCP server tools during code generation, refactoring, and debugging sessions. The getmcp CLI detects Trae by checking for the ~/.trae directory and writes configs to the project-level .trae/mcp.json.",
    prerequisites: [
      "Trae IDE installed (download from trae.ai)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Config file not created automatically: Trae does not create .trae/mcp.json by default. The getmcp CLI will create it for you, or create the .trae/ directory and mcp.json file manually.",
      "Server not loading after config change: Reload the Trae window (Cmd+Shift+P / Ctrl+Shift+P, then Developer: Reload Window) after editing .trae/mcp.json.",
      "Project config not shared with teammates: The .trae/mcp.json file should be committed to source control. Teammates can run getmcp sync after checkout to install servers into their own detected apps.",
      "Environment variables exposed in source control: Avoid hardcoding API keys in .trae/mcp.json if the file is committed. Use the getmcp CLI which prompts for values separately, or reference variables via your CI/CD secrets.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  "bolt-ai": {
    name: "BoltAI",
    slug: "bolt-ai",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/Library/Application Support/BoltAI/mcp_config.json",
    },
    overview:
      "BoltAI is a native macOS AI chat application that provides a system-wide AI assistant integrating with multiple model providers. It supports MCP servers through a global config file at ~/Library/Application Support/BoltAI/mcp_config.json, using the standard mcpServers root key and field names compatible with Claude Desktop. MCP servers registered in BoltAI extend its chat interface with tool-calling capabilities, allowing the AI to read files, search the web, query databases, and perform other actions directly within the macOS app. BoltAI is a macOS-only application — the getmcp generator only targets the Darwin platform and the CLI skips BoltAI detection on Linux and Windows.",
    prerequisites: [
      "BoltAI installed from the Mac App Store or boltai.com (macOS only)",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
      "macOS 13 Ventura or higher (required by BoltAI)",
    ],
    troubleshooting: [
      "Config directory not found: BoltAI creates ~/Library/Application Support/BoltAI/ on first launch. Open BoltAI at least once before adding MCP servers.",
      "Server not loading after config change: Quit and relaunch BoltAI — it reads mcp_config.json at startup. Use Cmd+Q to fully quit, not just closing the window.",
      "getmcp skips BoltAI on your machine: BoltAI is macOS-only. The getmcp CLI will not detect or generate configs for BoltAI on Linux or Windows — this is expected behavior.",
      "Sandbox restrictions blocking server binaries: If BoltAI is installed from the Mac App Store, sandbox restrictions may prevent it from launching certain server processes. Try installing BoltAI directly from boltai.com instead.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },

  "libre-chat": {
    name: "LibreChat",
    slug: "libre-chat",
    format: "YAML",
    rootKey: "mcpServers",
    configPaths: {
      project: "librechat.yaml",
    },
    overview:
      "LibreChat is an open-source, self-hosted web application that provides a ChatGPT-like interface supporting multiple AI providers including OpenAI, Anthropic, Google, and more. It supports MCP servers through a YAML configuration section in the root librechat.yaml file, using the mcpServers key. Unlike most apps that use JSON, LibreChat's entire configuration — including MCP — lives in a single YAML file alongside provider credentials, model settings, and feature flags. Stdio and remote servers are declared with the same field names as the canonical format. MCP tools become available to all models configured in LibreChat once the server is added and the application is restarted. The getmcp CLI generates YAML output for LibreChat automatically.",
    prerequisites: [
      "A self-hosted LibreChat instance (see librechat.ai for setup instructions)",
      "Docker or Node.js runtime for your LibreChat deployment",
      "Node.js 18 or higher on the host for running npx-based MCP servers",
      "Write access to the librechat.yaml file in your LibreChat installation directory",
    ],
    troubleshooting: [
      "MCP section not recognized: The mcpServers key must be at the top level of librechat.yaml. Nested incorrectly under another key, it will be silently ignored. Use a YAML linter to verify the structure.",
      "Server not available after editing librechat.yaml: LibreChat must be restarted after any config change. With Docker, run docker compose restart librechat to apply the new config.",
      "YAML indentation errors: YAML is whitespace-sensitive and does not allow tab characters. Use spaces only and verify the indentation with a YAML validator before restarting.",
      "Server process cannot find binaries: The MCP server process runs inside the LibreChat container (if using Docker). Install required runtimes (Node.js, Python, uv) inside the Docker image or mount them as volumes.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "postgres"],
  },

  antigravity: {
    name: "Antigravity",
    slug: "antigravity",
    format: "JSON",
    rootKey: "mcpServers",
    configPaths: {
      macos: "~/.gemini/antigravity/mcp_config.json",
      windows: "%UserProfile%\\.gemini\\antigravity\\mcp_config.json",
      linux: "~/.gemini/antigravity/mcp_config.json",
    },
    overview:
      "Antigravity is Google's AI-first IDE, designed for agentic software development with deep integration of Gemini models. It stores MCP server configuration at ~/.gemini/antigravity/mcp_config.json, using the standard mcpServers root key in JSON format — compatible with the canonical format used by Claude Desktop and other major apps. The config path sits under the ~/.gemini directory alongside Gemini CLI settings, reflecting the shared toolchain between Antigravity and other Google AI developer tools. MCP servers give Antigravity's AI agent access to external tools and resources during coding sessions, enabling actions like querying databases, searching documentation, and managing files. The getmcp CLI detects Antigravity by checking for the ~/.gemini/antigravity directory.",
    prerequisites: [
      "Antigravity IDE installed (see antigravity.google for installation instructions)",
      "A Google account with Gemini API access",
      "Node.js 18 or higher for running npx-based servers",
      "Python 3.10+ if installing Python-based servers",
    ],
    troubleshooting: [
      "Config directory not found: Antigravity creates ~/.gemini/antigravity/ on first launch. Open Antigravity at least once before adding MCP servers.",
      "Server not loading after config change: Restart Antigravity after editing mcp_config.json. The config is read at IDE startup.",
      "Conflict with Gemini CLI settings: Antigravity and Gemini CLI both live under ~/.gemini but in separate subdirectories. Changes to ~/.gemini/antigravity/mcp_config.json do not affect Gemini CLI's ~/.gemini/settings.json and vice versa.",
      "Tool calls failing with permission errors: Check that the MCP server binary has execute permission and that its required environment variables are set in the env block of the config entry.",
    ],
    popularServers: ["github", "filesystem", "brave-search", "sequential-thinking", "memory"],
  },
};
