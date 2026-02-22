/**
 * @getmcp/registry
 *
 * Registry of popular MCP server definitions in canonical format.
 * Provides lookup, search, and listing functions.
 */

import type { RegistryEntryType } from "@getmcp/core";

// Server definitions
import { github } from "./servers/github.js";
import { filesystem } from "./servers/filesystem.js";
import { braveSearch } from "./servers/brave-search.js";
import { memory } from "./servers/memory.js";
import { slack } from "./servers/slack.js";
import { postgres } from "./servers/postgres.js";
import { puppeteer } from "./servers/puppeteer.js";
import { sequentialThinking } from "./servers/sequential-thinking.js";
import { sentry } from "./servers/sentry.js";
import { context7 } from "./servers/context7.js";
import { fetch } from "./servers/fetch.js";
import { googleMaps } from "./servers/google-maps.js";
import { playwright } from "./servers/playwright.js";
import { chromeDevtools } from "./servers/chrome-devtools.js";
import { figma } from "./servers/figma.js";
import { firecrawl } from "./servers/firecrawl.js";
import { browserTools } from "./servers/browser-tools.js";
import { desktopCommander } from "./servers/desktop-commander.js";
import { repomix } from "./servers/repomix.js";
import { gitMcp } from "./servers/git-mcp.js";
import { n8nMcp } from "./servers/n8n-mcp.js";
import { claudeContext } from "./servers/claude-context.js";
import { pdf2zh } from "./servers/pdf2zh.js";
import { unityMcp } from "./servers/unity-mcp.js";
import { idaPro } from "./servers/ida-pro.js";
import { trendradar } from "./servers/trendradar.js";
import { mindsdb } from "./servers/mindsdb.js";
import { genaiToolbox } from "./servers/genai-toolbox.js";
import { scrapling } from "./servers/scrapling.js";
import { xiaohongshuMcp } from "./servers/xiaohongshu-mcp.js";
import { awsDocs } from "./servers/aws-docs.js";
import { nextDevtools } from "./servers/next-devtools.js";
import { supabase } from "./servers/supabase.js";
import { openaiDocs } from "./servers/openai-docs.js";
import { shadcn } from "./servers/shadcn.js";
// Batch 1: Developer Tools
import { gitlab } from "./servers/gitlab.js";
import { linear } from "./servers/linear.js";
import { jira } from "./servers/jira.js";
import { notion } from "./servers/notion.js";
import { todoist } from "./servers/todoist.js";
import { obsidian } from "./servers/obsidian.js";
import { terraform } from "./servers/terraform.js";
import { kubernetes } from "./servers/kubernetes.js";
import { dockerMcp } from "./servers/docker.js";
import { vercel } from "./servers/vercel.js";
// Batch 1: Data/Database
import { mysql } from "./servers/mysql.js";
import { sqlite } from "./servers/sqlite.js";
import { mongodb } from "./servers/mongodb.js";
import { redis } from "./servers/redis.js";
import { elasticsearch } from "./servers/elasticsearch.js";
// Batch 1: AI/Search
import { tavily } from "./servers/tavily.js";
import { exa } from "./servers/exa.js";
import { perplexity } from "./servers/perplexity.js";
import { anthropic } from "./servers/anthropic.js";
import { openai } from "./servers/openai.js";
// Batch 1: Cloud
import { aws } from "./servers/aws.js";
import { cloudflare } from "./servers/cloudflare.js";
import { gcp } from "./servers/gcp.js";
import { azure } from "./servers/azure.js";
import { digitalocean } from "./servers/digitalocean.js";
// Batch 1: Communication
import { discord } from "./servers/discord.js";
import { telegram } from "./servers/telegram.js";
import { email } from "./servers/email.js";
// Batch 1: Web/Utilities
import { stripe } from "./servers/stripe.js";
import { twilio } from "./servers/twilio.js";
import { airtable } from "./servers/airtable.js";
import { shopify } from "./servers/shopify.js";
import { youtube } from "./servers/youtube.js";
import { twitter } from "./servers/twitter.js";
import { time } from "./servers/time.js";

// Re-export individual servers for direct access
export {
  github,
  filesystem,
  braveSearch,
  memory,
  slack,
  postgres,
  puppeteer,
  sequentialThinking,
  sentry,
  context7,
  fetch,
  googleMaps,
  playwright,
  chromeDevtools,
  figma,
  firecrawl,
  browserTools,
  desktopCommander,
  repomix,
  gitMcp,
  n8nMcp,
  claudeContext,
  pdf2zh,
  unityMcp,
  idaPro,
  trendradar,
  mindsdb,
  genaiToolbox,
  scrapling,
  xiaohongshuMcp,
  awsDocs,
  nextDevtools,
  supabase,
  openaiDocs,
  shadcn,
  // Batch 1
  gitlab,
  linear,
  jira,
  notion,
  todoist,
  obsidian,
  terraform,
  kubernetes,
  dockerMcp,
  vercel,
  mysql,
  sqlite,
  mongodb,
  redis,
  elasticsearch,
  tavily,
  exa,
  perplexity,
  anthropic,
  openai,
  aws,
  cloudflare,
  gcp,
  azure,
  digitalocean,
  discord,
  telegram,
  email,
  stripe,
  twilio,
  airtable,
  shopify,
  youtube,
  twitter,
  time,
};

// ---------------------------------------------------------------------------
// Registry — all servers indexed by ID
// ---------------------------------------------------------------------------

const _registry: Map<string, RegistryEntryType> = new Map();

function register(entry: RegistryEntryType): void {
  _registry.set(entry.id, entry);
}

// Register all built-in servers
register(github);
register(filesystem);
register(braveSearch);
register(memory);
register(slack);
register(postgres);
register(puppeteer);
register(sequentialThinking);
register(sentry);
register(context7);
register(fetch);
register(googleMaps);
register(playwright);
register(chromeDevtools);
register(figma);
register(firecrawl);
register(browserTools);
register(desktopCommander);
register(repomix);
register(gitMcp);
register(n8nMcp);
register(claudeContext);
register(pdf2zh);
register(unityMcp);
register(idaPro);
register(trendradar);
register(mindsdb);
register(genaiToolbox);
register(scrapling);
register(xiaohongshuMcp);
register(awsDocs);
register(nextDevtools);
register(supabase);
register(openaiDocs);
register(shadcn);
// Batch 1
register(gitlab);
register(linear);
register(jira);
register(notion);
register(todoist);
register(obsidian);
register(terraform);
register(kubernetes);
register(dockerMcp);
register(vercel);
register(mysql);
register(sqlite);
register(mongodb);
register(redis);
register(elasticsearch);
register(tavily);
register(exa);
register(perplexity);
register(anthropic);
register(openai);
register(aws);
register(cloudflare);
register(gcp);
register(azure);
register(digitalocean);
register(discord);
register(telegram);
register(email);
register(stripe);
register(twilio);
register(airtable);
register(shopify);
register(youtube);
register(twitter);
register(time);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a server definition by its ID.
 * Returns undefined if not found.
 */
export function getServer(id: string): RegistryEntryType | undefined {
  return _registry.get(id);
}

/**
 * Get a server definition by its ID, throwing if not found.
 */
export function getServerOrThrow(id: string): RegistryEntryType {
  const entry = _registry.get(id);
  if (!entry) {
    throw new Error(
      `Server "${id}" not found in registry. Available: ${getServerIds().join(", ")}`,
    );
  }
  return entry;
}

/**
 * Get all registered server IDs.
 */
export function getServerIds(): string[] {
  return Array.from(_registry.keys()).sort();
}

/**
 * Get all registered server entries.
 */
export function getAllServers(): RegistryEntryType[] {
  return Array.from(_registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Search servers by a text query.
 * Matches against id, name, description, and categories.
 */
export function searchServers(query: string): RegistryEntryType[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllServers();

  return getAllServers().filter((entry) => {
    const searchable = [
      entry.id,
      entry.name,
      entry.description,
      ...(entry.categories ?? []),
      entry.author ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });
}

/**
 * Filter servers by category.
 */
export function getServersByCategory(category: string): RegistryEntryType[] {
  const cat = category.toLowerCase();
  return getAllServers().filter((entry) =>
    (entry.categories ?? []).some((c: string) => c.toLowerCase() === cat),
  );
}

/**
 * Get all unique categories across all servers.
 */
export function getCategories(): RegistryEntryType["categories"] {
  const categories = new Set<RegistryEntryType["categories"][number]>();
  for (const entry of _registry.values()) {
    for (const cat of entry.categories ?? []) {
      categories.add(cat);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Get the total number of registered servers.
 */
export function getServerCount(): number {
  return _registry.size;
}
