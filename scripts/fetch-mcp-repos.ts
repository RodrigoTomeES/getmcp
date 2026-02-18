import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface McpRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stars: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepoItem[];
}

interface GitHubRepoItem {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  created_at: string;
  updated_at: string;
}

interface OutputJson {
  fetched_at: string;
  total_count: number;
  query: string;
  repositories: McpRepo[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com/search/repositories";
const SEARCH_QUERY = "topic:mcp";
const PER_PAGE = 100;

// Script is always invoked from the project root via `npm run fetch-repos`
const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = resolve(PROJECT_ROOT, "data");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "top-mcp-repos.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}

function buildUrl(): string {
  const params = new URLSearchParams({
    q: SEARCH_QUERY,
    sort: "stars",
    order: "desc",
    per_page: String(PER_PAGE),
    page: "1",
  });
  return `${GITHUB_API}?${params.toString()}`;
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "getmcp-fetch-script",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function mapItem(item: GitHubRepoItem): McpRepo {
  return {
    name: item.name,
    full_name: item.full_name,
    description: item.description,
    html_url: item.html_url,
    stars: item.stargazers_count,
    language: item.language,
    topics: item.topics ?? [],
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const token = getToken();

  if (!token) {
    console.error(
      "Error: GITHUB_TOKEN environment variable is not set.\n" +
        "Create a personal access token at https://github.com/settings/tokens\n" +
        "and set it: export GITHUB_TOKEN=ghp_...",
    );
    process.exit(1);
  }

  const url = buildUrl();
  console.log(`Fetching top ${PER_PAGE} MCP repositories (sorted by stars)...`);
  console.log(`Query: ${SEARCH_QUERY}`);
  console.log(`URL:   ${url}\n`);

  const response = await fetch(url, { headers: buildHeaders(token) });

  if (!response.ok) {
    const body = await response.text();
    console.error(`GitHub API error ${response.status}: ${response.statusText}`);
    console.error(body);
    process.exit(1);
  }

  const data = (await response.json()) as GitHubSearchResponse;

  if (data.incomplete_results) {
    console.warn(
      "Warning: GitHub returned incomplete results. Some repos may be missing.\n",
    );
  }

  const repositories = data.items.map(mapItem);

  const output: OutputJson = {
    fetched_at: new Date().toISOString(),
    total_count: repositories.length,
    query: SEARCH_QUERY,
    repositories,
  };

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf-8");

  console.log(`Fetched ${repositories.length} repositories (out of ${data.total_count} total matches).`);
  console.log(`Saved to: ${OUTPUT_FILE}`);

  // Print top 10 as a quick summary
  console.log("\nTop 10 by stars:");
  for (const repo of repositories.slice(0, 10)) {
    console.log(
      `  ${String(repo.stars).padStart(6)} | ${repo.full_name} — ${repo.description?.slice(0, 60) ?? "(no description)"}`,
    );
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
