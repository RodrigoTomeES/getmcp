# @getmcp/registry

Registry of popular MCP server definitions in canonical format. Provides lookup, search, and listing functions.

## Install

```bash
npm install @getmcp/registry
```

## Usage

### Find and use a server

```ts
import { getServer, getServerBySlug, getServerOrThrow, searchServers } from "@getmcp/registry";

// Lookup by official ID (reverse-DNS name)
const github = getServer("io.github.github/github-mcp-server");
// => { id: "io.github.github/github-mcp-server", slug: "github-github", name: "GitHub", ... }

// Lookup by slug (for web URLs — use getServerBySlug, not getServer)
const github2 = getServerBySlug("github-github");

// Throws if not found
const fs = getServerOrThrow("io.github.modelcontextprotocol/server-filesystem");

// Search by text query (matches id, slug, name, description, categories, author, tags)
const results = searchServers("database");
// => [{ id: "io.github.modelcontextprotocol/server-postgres", slug: "postgres", ... }]
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

getAllServers(); // All server entries, sorted by ID
getServerIds(); // ["io.github.anthropics/...", "io.github.github/...", ...]
getServersByCategory("web"); // Servers tagged with "web"
getCategories(); // All unique categories
getServerCount(); // Total number of registered servers
```

## Architecture

Server definitions are stored in a single `data/servers.json` file, synced from the [official MCP registry](https://registry.modelcontextprotocol.io) via an automated sync pipeline (`npm run sync`). Each entry uses an official reverse-DNS name as its canonical ID (e.g. `io.github.github/github-mcp-server`) with a URL-friendly slug for display (e.g. `github-github`). Entries are validated against the `RegistryEntry` Zod schema at load time. To add a new server, submit it to the official MCP registry — getmcp syncs automatically via a daily GitHub Actions workflow.

Browse all servers at [getmcp.es](https://getmcp.es) or from the CLI:

```bash
npx @getmcp/cli list
```

## API

| Export                           | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `getServer(id)`                  | Get server by official ID (reverse-DNS name)                                  |
| `getServerBySlug(slug)`          | Get server by slug directly                                                   |
| `getServerOrThrow(id)`           | Get server by official ID (throws if not found)                               |
| `getAllServers()`                | Get all server entries sorted by ID                                           |
| `getServerIds()`                 | Get all server IDs sorted (reverse-DNS format)                                |
| `searchServers(query)`           | Full-text search across id, slug, name, description, categories, author, tags |
| `getServersByCategory(cat)`      | Filter servers by category                                                    |
| `getCategories()`                | Get all unique categories                                                     |
| `getServerCount()`               | Total number of registered servers                                            |
| `findServerByCommand(cmd, args)` | Find server by command and args                                               |
| `getServerMetrics(id)`           | Get GitHub/npm/PyPI metrics for a server                                      |
| `getAllMetrics()`                | Get all server metrics                                                        |
| `getRawServerData(id)`           | Get raw registry entry data before internal transformation                    |
| `getServersSortedBy(metric, n?)` | Get servers sorted by a metric (stars, downloads, etc.)                       |
| `loadFromEntries(entries)`       | Load registry from an array of entries                                        |
| `loadFromPath(path)`             | Load registry from a JSON file path                                           |
| `resetRegistry()`                | Reset registry to default data                                                |

## License

MIT
