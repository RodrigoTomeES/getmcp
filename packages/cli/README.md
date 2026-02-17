# @mcp-hub/cli

CLI tool to install MCP servers into any AI application with one command. Auto-detects installed apps, generates the correct config format, and merges it into existing config files without overwriting.

## Install

```bash
# Run directly with npx (no install needed)
npx @mcp-hub/cli add github

# Or install globally
npm install -g @mcp-hub/cli
```

## Commands

### `mcp-hub add [server-id]`

Install an MCP server into your AI apps.

```bash
# Interactive mode — select a server and target apps
mcp-hub add

# Install a specific server
mcp-hub add github

# Install with environment variables prompted interactively
mcp-hub add brave-search
# => Prompts: Enter BRAVE_API_KEY: ****
```

The `add` command will:
1. Look up the server in the built-in registry
2. Auto-detect which AI apps you have installed
3. Ask which apps you want to configure (or configure all)
4. Prompt for any required environment variables
5. Generate the correct config format for each app
6. Merge the config into each app's config file (never overwrites existing servers)

### `mcp-hub remove <server-name>`

Remove an MCP server from your AI app configs.

```bash
mcp-hub remove github
```

### `mcp-hub list`

Browse the server registry.

```bash
# List all available servers
mcp-hub list

# Search for servers
mcp-hub list --search=database

# Filter by category
mcp-hub list --category=developer-tools

# List servers installed in your detected apps
mcp-hub list --installed
```

## Supported Apps

The CLI auto-detects and generates configs for:

| App | Config Location |
|-----|----------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%AppData%\Claude\claude_desktop_config.json` (Windows) |
| Claude Code | `.mcp.json` (project), `~/.claude.json` (user) |
| VS Code / Copilot | `.vscode/mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Cline | `cline_mcp_settings.json` (VS Code globalStorage) |
| Roo Code | `mcp_settings.json` (VS Code globalStorage) |
| Goose | `~/.config/goose/config.yaml` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| OpenCode | `opencode.json` |
| Zed | `settings.json` (Zed settings) |

## Programmatic API

The CLI also exports its functions for use as a library:

```ts
import {
  detectApps,
  detectInstalledApps,
  readConfigFile,
  writeConfigFile,
  mergeServerIntoConfig,
  removeServerFromConfig,
  listServersInConfig,
} from "@mcp-hub/cli";

// Detect which apps are installed
const apps = await detectInstalledApps();

// Read an app's config file
const config = await readConfigFile("/path/to/config.json");

// Merge a new server into an existing config
const updated = mergeServerIntoConfig(config, "github", serverConfig, "claude-desktop");

// Write back (preserves existing content)
await writeConfigFile("/path/to/config.json", updated);
```

## Options

```
mcp-hub --help       Show help message
mcp-hub --version    Show version number
```

## License

MIT
