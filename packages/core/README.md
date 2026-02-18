# @getmcp/core

Core types, schemas, and validation for the getmcp canonical configuration format. Aligned with [FastMCP](https://github.com/jlowin/fastmcp)'s standard.

## Install

```bash
npm install @getmcp/core
```

## Usage

### Schema Validation

All schemas use [Zod](https://zod.dev) for runtime validation:

```ts
import { StdioServerConfig, RemoteServerConfig, CanonicalMCPConfig } from "@getmcp/core";

// Validate a stdio server config
const result = StdioServerConfig.safeParse({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "..." },
});

if (result.success) {
  console.log(result.data); // typed StdioServerConfigType
}

// Validate a remote server config
RemoteServerConfig.parse({
  url: "https://mcp.example.com/sse",
  headers: { Authorization: "Bearer token" },
});

// Validate a full canonical config
CanonicalMCPConfig.parse({
  mcpServers: {
    github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
    sentry: { url: "https://mcp.sentry.dev/sse" },
  },
});
```

### Type Guards

```ts
import { isStdioConfig, isRemoteConfig, inferTransport } from "@getmcp/core";

const config = { command: "npx", args: ["server"] };

isStdioConfig(config);   // true
isRemoteConfig(config);  // false
inferTransport(config);  // "stdio"
```

### TypeScript Types

Types are inferred from Zod schemas:

```ts
import type {
  StdioServerConfigType,
  RemoteServerConfigType,
  ServerConfigType,
  RegistryEntryType,
  AppIdType,
  ConfigGenerator,
  AppMetadata,
} from "@getmcp/core";
```

## Schemas

| Schema | Description |
|--------|-------------|
| `StdioServerConfig` | Local server with `command`, `args`, `env` |
| `RemoteServerConfig` | Remote server with `url`, `headers` |
| `ServerConfig` | Union of stdio and remote |
| `LooseServerConfig` | Passthrough schema for unknown fields |
| `CanonicalMCPConfig` | Top-level `{ mcpServers: { ... } }` |
| `RegistryEntry` | Server definition for the registry |
| `AppId` | Enum of supported app identifiers |
| `TransportType` | `"stdio" | "sse" | "streamable-http"` |

## Supported Apps

`AppId` includes: `claude-desktop`, `claude-code`, `vscode`, `cursor`, `cline`, `roo-code`, `goose`, `windsurf`, `opencode`, `zed`

## License

MIT
