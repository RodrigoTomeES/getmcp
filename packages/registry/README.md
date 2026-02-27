# @getmcp/registry

Registry of popular MCP server definitions in canonical format. Provides lookup, search, and listing functions.

## Install

```bash
npm install @getmcp/registry
```

## Usage

### Find and use a server

```ts
import { getServer, getServerOrThrow, searchServers } from "@getmcp/registry";

// Lookup by ID
const github = getServer("github");
// => { id: "github", name: "GitHub", description: "...", config: { command: "npx", ... }, ... }

// Throws if not found
const fs = getServerOrThrow("filesystem");

// Search by text query (matches id, name, description, categories)
const results = searchServers("database");
// => [{ id: "postgres", ... }]
```

### Browse the registry

```ts
import {
  getAllServers,
  getServerIds,
  getServersByCategory,
  getCategories,
  getServerCount,
} from "@getmcp/registry";

getAllServers(); // All 106 server entries, sorted by ID
getServerIds(); // ["airtable", "anthropic", "apify", ...]
getServersByCategory("web"); // Servers tagged with "web"
getCategories(); // All unique categories
getServerCount(); // 106
```

## Architecture

Server definitions are stored as individual JSON files in `servers/` and auto-discovered at build time. Each file is validated against the `RegistryEntry` Zod schema during `npm run build`. No manual imports or registration needed — just add a `.json` file.

Browse all 106 servers at [installmcp.dev](https://installmcp.dev) or from the CLI:

```bash
npx @getmcp/cli list
```

## API

| Export                      | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `getServer(id)`             | Get server entry by ID (returns `undefined` if not found) |
| `getServerOrThrow(id)`      | Get server entry by ID (throws if not found)              |
| `getAllServers()`           | Get all server entries sorted by ID                       |
| `getServerIds()`            | Get all server IDs sorted                                 |
| `searchServers(query)`      | Full-text search across id, name, description, categories |
| `getServersByCategory(cat)` | Filter servers by category                                |
| `getCategories()`           | Get all unique categories                                 |
| `getServerCount()`          | Total number of registered servers                        |

## License

MIT
