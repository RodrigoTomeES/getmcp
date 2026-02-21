# @getmcp/cli

CLI tool to install MCP servers into any AI application with one command. Auto-detects installed apps, generates the correct config format, and merges it into existing config files without overwriting. Tracks installations in a project-level `getmcp-lock.json` for team sharing and update workflows.

## Install

```bash
# Run directly with npx (no install needed)
npx @getmcp/cli add github

# Or install globally
npm install -g @getmcp/cli
```

## Commands

### `getmcp add [server-id]`

Install an MCP server into your AI apps.

```bash
# Interactive mode — select a server and target apps
getmcp add

# Install a specific server
getmcp add github

# Install with environment variables prompted interactively
getmcp add brave-search
# => Prompts: Enter BRAVE_API_KEY: ****

# Install to a specific app (non-interactive)
getmcp add github --app claude-desktop

# Install to multiple apps
getmcp add github --app vscode --app cursor

# Install to all detected apps without prompts
getmcp add github -y --all-apps

# Preview what would be written
getmcp add github --dry-run
```

The `add` command will:
1. Look up the server in the built-in registry
2. Auto-detect which AI apps you have installed
3. Ask which apps you want to configure (or configure all)
4. Prompt for any required environment variables
5. Generate the correct config format for each app
6. Merge the config into each app's config file (never overwrites existing servers)
7. Track the installation in `getmcp-lock.json`

### `getmcp remove <server-name>`

Remove an MCP server from your AI app configs.

```bash
# Interactive removal
getmcp remove github

# Remove without confirmation
getmcp remove github --yes

# Preview what would change
getmcp remove github --dry-run
```

### `getmcp list`

Browse the server registry.

```bash
# List all available servers
getmcp list

# Search for servers
getmcp list --search=database

# Filter by category
getmcp list --category=developer-tools

# List servers installed in your detected apps
getmcp list --installed
```

### `getmcp find [query]`

Interactive fuzzy search through the registry. After selecting a server, jumps directly into the `add` flow.

```bash
# Interactive search prompt
getmcp find

# Search with a query
getmcp find database

# Aliases
getmcp search github
getmcp s docker
getmcp f web
```

### `getmcp check`

Validate tracked installations against the registry and app configs. Reports servers removed from registry, servers missing from app configs, and apps that are no longer detected.

```bash
getmcp check
```

### `getmcp update`

Re-generate and merge configs for all tracked installations using the latest registry definitions.

```bash
# Interactive update
getmcp update

# Update without confirmation
getmcp update --yes

# Update only for specific apps
getmcp update --app vscode --app cursor

# Preview what would change
getmcp update --dry-run
```

### `getmcp init`

Interactive wizard to scaffold a new MCP server registry entry. Prompts for metadata (ID, name, description, transport, command/URL, env vars, categories, runtime) and generates a TypeScript file ready for registration.

```bash
getmcp init
```

## Command Aliases

| Command | Aliases |
|---------|---------|
| `add` | `install`, `i` |
| `remove` | `rm`, `r`, `uninstall` |
| `list` | `ls` |
| `find` | `search`, `s`, `f` |

## Options

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version number |
| `--yes`, `-y` | Skip confirmation prompts (use defaults) |
| `--app <id>` | Target a specific app (repeatable for multiple apps) |
| `--all-apps` | Target all detected apps |
| `--dry-run` | Preview changes without writing files |
| `--installed` | List servers installed in detected apps (for `list` command) |
| `--search=<query>` | Search the registry (for `list` command) |
| `--category=<cat>` | Filter by category (for `list` command) |

## Installation Tracking

When you install or remove servers, getmcp records the action in a `getmcp-lock.json` file in the current working directory. This file:

- Tracks which servers are installed to which apps
- Records which environment variable names were set (values are **not** stored for security)
- Stores installation and last-update timestamps
- Can be **committed to version control** for team sharing (like `package-lock.json`)

The lock file enables the `check` and `update` commands — `check` compares your lock file against actual app configs to detect drift, and `update` re-applies configs from the registry.

## Supported Apps

The CLI auto-detects and generates configs for:

| App | Config Location | Format |
|-----|----------------|--------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%AppData%\Claude\claude_desktop_config.json` (Windows) | JSON |
| Claude Code | `.mcp.json` (project), `~/.claude.json` (user) | JSON |
| VS Code / Copilot | `.vscode/mcp.json` | JSON |
| Cursor | `.cursor/mcp.json` | JSON |
| Cline | `cline_mcp_settings.json` (VS Code globalStorage) | JSON |
| Roo Code | `mcp_settings.json` (VS Code globalStorage) | JSON |
| Goose | `~/.config/goose/config.yaml` | YAML |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | JSON |
| OpenCode | `opencode.json` | JSONC |
| Zed | `settings.json` (Zed settings) | JSON |
| PyCharm | `.ai/mcp/mcp.json` (project-level, requires JetBrains AI Assistant plugin) | JSON |
| Codex | `~/.codex/config.toml` (global), `.codex/config.toml` (project) | TOML |

## Programmatic API

The CLI also exports its functions for use as a library:

```ts
import {
  // App detection
  detectApps,
  detectInstalledApps,
  // Config file operations
  readConfigFile,
  writeConfigFile,
  mergeServerIntoConfig,
  removeServerFromConfig,
  listServersInConfig,
  // Installation tracking
  readLockFile,
  writeLockFile,
  trackInstallation,
  trackRemoval,
  getTrackedServers,
  getLockFilePath,
  // Preferences
  readPreferences,
  saveSelectedApps,
  getSavedSelectedApps,
  // Utilities
  shortenPath,
  parseFlags,
  resolveAlias,
  // Errors
  CliError,
  formatError,
} from "@getmcp/cli";

// Detect which apps are installed
const apps = await detectInstalledApps();

// Read an app's config file
const config = await readConfigFile("/path/to/config.json");

// Merge a new server into an existing config
const updated = mergeServerIntoConfig(config, "github", serverConfig, "claude-desktop");

// Write back (preserves existing content)
await writeConfigFile("/path/to/config.json", updated);

// Track the installation
trackInstallation("github", ["claude-desktop"], ["GITHUB_PERSONAL_ACCESS_TOKEN"]);
```

## License

MIT
