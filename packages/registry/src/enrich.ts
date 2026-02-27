/**
 * GitHub enrichment for MCP registry entries.
 * Maps GitHub topics to getmcp categories, extracts license, language, etc.
 */

import type { GetMCPEnrichmentType, CategoryType, RuntimeType } from "./enrichment-types.js";

// ---------------------------------------------------------------------------
// GitHub topic → category mapping
// ---------------------------------------------------------------------------

const TOPIC_CATEGORY_MAP: Record<string, CategoryType> = {
  // developer-tools
  "developer-tools": "developer-tools",
  "dev-tools": "developer-tools",
  ide: "developer-tools",
  git: "developer-tools",
  github: "developer-tools",
  gitlab: "developer-tools",
  vscode: "developer-tools",
  debugging: "developer-tools",
  testing: "developer-tools",
  linter: "developer-tools",
  formatter: "developer-tools",
  sdk: "developer-tools",
  api: "developer-tools",
  cli: "developer-tools",
  terminal: "developer-tools",

  // web
  web: "web",
  "web-scraping": "web",
  scraping: "web",
  crawler: "web",
  browser: "web",
  html: "web",
  css: "web",
  javascript: "web",
  frontend: "web",
  "web-development": "web",
  puppeteer: "web",
  playwright: "web",
  selenium: "web",

  // automation
  automation: "automation",
  workflow: "automation",
  "task-automation": "automation",
  bot: "automation",
  robotics: "automation",
  rpa: "automation",
  zapier: "automation",
  n8n: "automation",

  // data
  data: "data",
  database: "data",
  sql: "data",
  postgres: "data",
  postgresql: "data",
  mysql: "data",
  mongodb: "data",
  sqlite: "data",
  redis: "data",
  elasticsearch: "data",
  analytics: "data",
  "data-science": "data",
  csv: "data",
  json: "data",
  graphql: "data",
  "big-data": "data",

  // search
  search: "search",
  "search-engine": "search",
  "web-search": "search",
  "brave-search": "search",
  tavily: "search",
  bing: "search",
  google: "search",
  rag: "search",

  // ai
  ai: "ai",
  llm: "ai",
  "machine-learning": "ai",
  ml: "ai",
  "deep-learning": "ai",
  "natural-language-processing": "ai",
  nlp: "ai",
  openai: "ai",
  anthropic: "ai",
  "generative-ai": "ai",
  gpt: "ai",
  "text-generation": "ai",
  "image-generation": "ai",
  "computer-vision": "ai",

  // cloud
  cloud: "cloud",
  aws: "cloud",
  azure: "cloud",
  gcp: "cloud",
  "google-cloud": "cloud",
  kubernetes: "cloud",
  docker: "cloud",
  serverless: "cloud",
  cloudflare: "cloud",
  terraform: "cloud",
  vercel: "cloud",
  netlify: "cloud",
  heroku: "cloud",

  // communication
  communication: "communication",
  email: "communication",
  slack: "communication",
  discord: "communication",
  chat: "communication",
  messaging: "communication",
  notifications: "communication",
  twilio: "communication",
  telegram: "communication",

  // design
  design: "design",
  figma: "design",
  ui: "design",
  ux: "design",
  "graphic-design": "design",
  sketch: "design",
  canva: "design",
  images: "design",
  svg: "design",

  // documentation
  documentation: "documentation",
  docs: "documentation",
  wiki: "documentation",
  markdown: "documentation",
  knowledge: "documentation",
  "knowledge-base": "documentation",
  notes: "documentation",
  obsidian: "documentation",
  notion: "documentation",
  confluence: "documentation",

  // devops
  devops: "devops",
  "ci-cd": "devops",
  cicd: "devops",
  monitoring: "devops",
  observability: "devops",
  logging: "devops",
  sentry: "devops",
  prometheus: "devops",
  grafana: "devops",
  datadog: "devops",
  infrastructure: "devops",
  deployment: "devops",

  // utilities
  utilities: "utilities",
  utility: "utilities",
  tools: "utilities",
  "file-system": "utilities",
  filesystem: "utilities",
  time: "utilities",
  calendar: "utilities",
  weather: "utilities",
  maps: "utilities",
  geolocation: "utilities",
  qr: "utilities",
  pdf: "utilities",
  math: "utilities",
  calculator: "utilities",

  // security
  security: "security",
  encryption: "security",
  authentication: "security",
  oauth: "security",
  "cyber-security": "security",
  pentest: "security",
  vulnerability: "security",
  firewall: "security",

  // gaming
  gaming: "gaming",
  game: "gaming",
  "game-development": "gaming",
  unity: "gaming",
  "unreal-engine": "gaming",
  minecraft: "gaming",
  steam: "gaming",
};

/**
 * Map GitHub topics to getmcp categories.
 * Returns deduplicated sorted list.
 */
export function mapTopicsToCategories(topics: string[]): CategoryType[] {
  const categories = new Set<CategoryType>();
  for (const topic of topics) {
    const cat = TOPIC_CATEGORY_MAP[topic.toLowerCase()];
    if (cat) categories.add(cat);
  }
  return Array.from(categories).sort();
}

/**
 * Infer runtime from package registryType and other signals.
 */
export function inferRuntime(registryType?: string, language?: string): RuntimeType | undefined {
  if (registryType === "npm") return "node";
  if (registryType === "pypi") return "python";
  if (registryType === "oci") return "docker";

  if (language) {
    const lang = language.toLowerCase();
    if (lang === "typescript" || lang === "javascript") return "node";
    if (lang === "python") return "python";
    if (lang === "go" || lang === "rust" || lang === "c" || lang === "c++") return "binary";
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// GitHub API types
// ---------------------------------------------------------------------------

export interface GitHubRepoInfo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string } | null;
  language: string | null;
  topics: string[];
  pushed_at: string;
  archived: boolean;
  owner: { login: string; type: string };
}

/**
 * Parse a GitHub repository URL to extract owner and repo.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

/**
 * Fetch GitHub repo info. Returns null on failure.
 */
export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  token?: string,
): Promise<GitHubRepoInfo | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "getmcp-sync",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!resp.ok) return null;
    return (await resp.json()) as GitHubRepoInfo;
  } catch {
    return null;
  }
}

/**
 * Build enrichment data from GitHub repo info and package metadata.
 */
export function buildEnrichment(
  slug: string,
  repoInfo: GitHubRepoInfo | null,
  registryType?: string,
  publisherKeywords?: string[],
): Omit<GetMCPEnrichmentType, "slug"> & { slug: string } {
  const topics = repoInfo?.topics ?? [];
  const allTopics = [...topics, ...(publisherKeywords ?? [])];
  const categories = mapTopicsToCategories(allTopics);
  const runtime = inferRuntime(registryType, repoInfo?.language ?? undefined);

  return {
    slug,
    categories,
    author: repoInfo?.owner?.login,
    license: repoInfo?.license?.spdx_id ?? undefined,
    language: repoInfo?.language ?? undefined,
    tags: allTopics.length > 0 ? allTopics : undefined,
    runtime,
  };
}
