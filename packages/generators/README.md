# @mcp-hub/generators

Config generators that transform canonical MCP server definitions into app-specific configuration formats for 10 AI applications.

## Install

```bash
npm install @mcp-hub/generators
```

## Usage

### Generate config for a specific app

```ts
import { generateConfig, getGenerator } from "@mcp-hub/generators";

// Quick generation
const config = generateConfig("claude-desktop", "github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});
// => { mcpServers: { github: { command: "npx", args: [...], env: {...} } } }

// Using generator instance directly
const generator = getGenerator("cursor");
const obj = generator.generate("github", { command: "npx", args: ["server"] });
const text = generator.serialize(obj);
```

### Generate config for ALL apps at once

```ts
import { generateAllConfigs } from "@mcp-hub/generators";

const configs = generateAllConfigs("github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});

// configs["claude-desktop"] => JSON string
// configs["goose"]          => YAML string
// configs["vscode"]         => JSON string (different root key + type field)
// ... all 10 apps
```

### Individual generator classes

```ts
import {
  ClaudeDesktopGenerator,
  ClaudeCodeGenerator,
  VSCodeGenerator,
  CursorGenerator,
  ClineGenerator,
  RooCodeGenerator,
  GooseGenerator,
  WindsurfGenerator,
  OpenCodeGenerator,
  ZedGenerator,
} from "@mcp-hub/generators";

const goose = new GooseGenerator();
const config = goose.generate("github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});
// => { extensions: { github: { cmd: "npx", args: [...], envs: {...} } } }

goose.serialize(config);
// => YAML string
```

## Supported Apps

| App | Root Key | Format | Key Differences |
|-----|----------|--------|-----------------|
| Claude Desktop | `mcpServers` | JSON | Canonical passthrough |
| Claude Code | `mcpServers` | JSON | `type` field for remote |
| VS Code / Copilot | `servers` | JSON | Requires `type` field |
| Cursor | `mcpServers` | JSON | Passthrough |
| Cline | `mcpServers` | JSON | `alwaysAllow`, `disabled` |
| Roo Code | `mcpServers` | JSON | `alwaysAllow`, `disabled` |
| Goose | `extensions` | YAML | `cmd`/`envs` keys |
| Windsurf | `mcpServers` | JSON | `serverUrl` for remote |
| OpenCode | `mcp` | JSONC | `command` is array |
| Zed | `context_servers` | JSON | Standard fields |

## API

| Export | Description |
|--------|-------------|
| `generators` | Map of `AppId` to generator instances |
| `getGenerator(appId)` | Get a generator by app ID |
| `getAppIds()` | List all available app IDs |
| `generateConfig(appId, name, config)` | Generate config object for one app |
| `generateAllConfigs(name, config)` | Generate serialized config strings for all apps |
| `BaseGenerator` | Abstract base class for building custom generators |

## License

MIT
