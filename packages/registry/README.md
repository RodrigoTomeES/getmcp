# @mcp-hub/registry

Registry of popular MCP server definitions in canonical format. Provides lookup, search, and listing functions.

## Install

```bash
npm install @mcp-hub/registry
```

## Usage

### Find and use a server

```ts
import { getServer, getServerOrThrow, searchServers } from "@mcp-hub/registry";

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
} from "@mcp-hub/registry";

getAllServers();              // All 12 server entries, sorted by ID
getServerIds();              // ["brave-search", "context7", "fetch", ...]
getServersByCategory("web"); // Servers tagged with "web"
getCategories();             // All unique categories
getServerCount();            // 12
```

### Access individual server definitions

```ts
import { github, filesystem, braveSearch, memory, slack, postgres } from "@mcp-hub/registry";

console.log(github.config);
// { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_TOKEN: "" } }
```

## Included Servers

| ID | Name | Transport | Categories |
|----|------|-----------|------------|
| `brave-search` | Brave Search | stdio | search, web |
| `context7` | Context7 | remote | documentation, search, developer-tools |
| `fetch` | Fetch | stdio | web, utilities |
| `filesystem` | Filesystem | stdio | filesystem, utilities |
| `github` | GitHub | stdio | developer-tools, git, version-control |
| `google-maps` | Google Maps | stdio | maps, location, utilities |
| `memory` | Memory | stdio | memory, knowledge-graph |
| `postgres` | PostgreSQL | stdio | database, sql |
| `puppeteer` | Puppeteer | stdio | browser, automation, web-scraping |
| `sentry` | Sentry | remote | monitoring, error-tracking, developer-tools |
| `sequential-thinking` | Sequential Thinking | stdio | reasoning, utilities |
| `slack` | Slack | stdio | communication, messaging |

## API

| Export | Description |
|--------|-------------|
| `getServer(id)` | Get server entry by ID (returns `undefined` if not found) |
| `getServerOrThrow(id)` | Get server entry by ID (throws if not found) |
| `getAllServers()` | Get all server entries sorted by ID |
| `getServerIds()` | Get all server IDs sorted |
| `searchServers(query)` | Full-text search across id, name, description, categories |
| `getServersByCategory(cat)` | Filter servers by category |
| `getCategories()` | Get all unique categories |
| `getServerCount()` | Total number of registered servers |

## License

MIT
