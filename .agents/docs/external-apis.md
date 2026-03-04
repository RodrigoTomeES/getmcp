# External APIs

getmcp's sync pipeline fetches server metadata, download counts, and package info from 7 external APIs. This document serves as the internal reference for contributors debugging sync issues or extending the pipeline.

---

## API Summary

| API           | Base URL                           | Endpoint                                   | Data Fetched                                                              | Source File                          |
| ------------- | ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------ |
| MCP Registry  | `registry.modelcontextprotocol.io` | `GET /v0.1/servers`                        | Server definitions (paginated, cursor-based)                              | `sync.ts`, `registry-cache-fetch.ts` |
| GitHub REST   | `api.github.com`                   | `GET /repos/{owner}/{repo}`                | Stars, forks, open issues, last push, archived, license, language, topics | `enrich.ts`                          |
| npm Registry  | `registry.npmjs.org`               | `GET /{package}/latest`                    | Latest version, TypeScript types (`types`/`typings` fields)               | `fetch-metrics.ts`                   |
| npm Downloads | `api.npmjs.org`                    | `GET /downloads/point/last-week/{package}` | Weekly download count                                                     | `fetch-metrics.ts`                   |
| PyPI JSON     | `pypi.org`                         | `GET /pypi/{package}/json`                 | Latest version                                                            | `fetch-metrics.ts`                   |
| PyPI Stats    | `pypistats.org`                    | `GET /api/packages/{package}/recent`       | Weekly downloads (`data.last_week`)                                       | `fetch-metrics.ts`                   |
| Docker Hub    | `hub.docker.com`                   | `GET /v2/repositories/{ns}/{repo}/`        | Pull count, image size                                                    | `fetch-metrics.ts`                   |

---

## API Details

### MCP Registry

- **URL**: `https://registry.modelcontextprotocol.io/v0.1/servers`
- **Docs**: https://modelcontextprotocol.io
- **Used in**: `packages/registry/scripts/sync.ts` (sync pipeline), `packages/cli/src/registry-cache-fetch.ts` (CLI cache)
- **Pagination**: Cursor-based. Query params: `limit` (default 100), `cursor`, `version` (`latest`), `updated_since` (ISO timestamp for incremental sync).
- **Response shape**: `{ servers: OfficialServerResponseType[], metadata: { nextCursor?: string, count: number } }`
- **Error handling**: Throws on non-OK status. CLI has a 30s timeout per request and a safety limit of 1,000 pages.
- **Auth**: No authentication required. CLI supports custom registries with auth headers via `buildAuthHeaders()`.

### GitHub REST API

- **URL**: `https://api.github.com/repos/{owner}/{repo}`
- **Docs**: https://docs.github.com/en/rest/repos/repos#get-a-repository
- **Used in**: `packages/registry/src/enrich.ts`
- **Headers**: `Accept: application/vnd.github.v3+json`, `User-Agent: getmcp-sync`. Optional `Authorization: Bearer {token}`.
- **Data extracted**: `stargazers_count`, `forks_count`, `open_issues_count`, `license.spdx_id`, `language`, `topics`, `pushed_at`, `archived`, `owner.login`.
- **Error handling**: Returns `null` on any non-OK response or network error.
- **Rate limiting**: 60 requests/hour unauthenticated, 5,000/hour with `GITHUB_TOKEN`. The sync pipeline logs a warning when `GITHUB_TOKEN` is not set.
- **Retry**: No retry logic (single attempt per request).

### npm Registry

- **URL**: `https://registry.npmjs.org/{package}/latest`
- **Docs**: https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md
- **Used in**: `packages/registry/src/fetch-metrics.ts` (`fetchNpmMetrics`)
- **Data extracted**: `version` (latest version), `types`/`typings` (TypeScript support detection).
- **Error handling**: Returns `null` on failure. Fetched in parallel with npm Downloads.
- **Retry**: Uses `fetchWithRetry` (3 retries on HTTP 429, exponential backoff starting at 500ms).

### npm Downloads API

- **URL**: `https://api.npmjs.org/downloads/point/last-week/{package}`
- **Docs**: https://github.com/npm/registry/blob/main/docs/download-counts.md
- **Used in**: `packages/registry/src/fetch-metrics.ts` (`fetchNpmMetrics`)
- **Data extracted**: `downloads` (weekly download count).
- **Error handling**: Returns `null` if the downloads response is non-OK. This is the primary check — if downloads fail, the entire npm metrics call returns `null`.
- **Retry**: Uses `fetchWithRetry` (3 retries on HTTP 429, exponential backoff starting at 500ms).

### PyPI JSON API

- **URL**: `https://pypi.org/pypi/{package}/json`
- **Docs**: https://docs.pypi.org/api/json/
- **Used in**: `packages/registry/src/fetch-metrics.ts` (`fetchPyPIMetrics`)
- **Data extracted**: `info.version` (latest version).
- **Error handling**: Returns `null` on failure. Fetched in parallel with PyPI Stats.
- **Retry**: Uses `fetchWithRetry` (3 retries on HTTP 429, exponential backoff starting at 500ms).

### PyPI Stats

- **URL**: `https://pypistats.org/api/packages/{package}/recent`
- **Docs**: https://pypistats.org/api
- **Used in**: `packages/registry/src/fetch-metrics.ts` (`fetchPyPIMetrics`)
- **Data extracted**: `data.last_week` (weekly download count).
- **Error handling**: Returns `null` if both stats and package responses fail. Either field alone is sufficient.
- **Retry**: Uses `fetchWithRetry` (3 retries on HTTP 429, exponential backoff starting at 500ms).

### Docker Hub

- **URL**: `https://hub.docker.com/v2/repositories/{namespace}/{repo}/`
- **Docs**: https://docs.docker.com/docker-hub/api/latest
- **Used in**: `packages/registry/src/fetch-metrics.ts` (`fetchDockerMetrics`)
- **Data extracted**: `pull_count`, `full_size` (image size, optional).
- **Namespace handling**: Bare images (e.g. `nginx`) use `library` as namespace. `docker.io/` prefix is stripped. Non-Docker-Hub registries (URLs containing dots that aren't `docker.io/`) are skipped.
- **Error handling**: Returns `null` on non-OK response or network error.
- **Retry**: Uses `fetchWithRetry` (3 retries on HTTP 429, exponential backoff starting at 500ms).

---

## Retry Logic

All fetchers in `fetch-metrics.ts` use a shared `fetchWithRetry` helper:

- **Retries**: 3 attempts (4 total including the initial request)
- **Trigger**: Only retries on HTTP 429 (Too Many Requests)
- **Backoff**: Exponential — 500ms, 1s, 2s
- **Fallback**: Returns a synthetic `Response` with status 429 after all retries exhausted

GitHub API calls in `enrich.ts` do **not** use retry logic — they make a single attempt and return `null` on failure.

---

## Concurrency

The sync pipeline (`sync.ts`) uses `withConcurrency()` from `fetch-metrics.ts` to limit parallel API calls:

- **Default concurrency**: 10 concurrent workers
- Applies to both GitHub enrichment and metrics fetching phases
