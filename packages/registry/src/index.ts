/**
 * @getmcp/registry
 *
 * Registry of popular MCP server definitions in canonical format.
 * Provides lookup, search, and listing functions.
 */

import { RegistryEntry } from "@getmcp/core";
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
// Batch 2: Project Management
import { bitbucket } from "./servers/bitbucket.js";
import { asana } from "./servers/asana.js";
import { clickup } from "./servers/clickup.js";
import { trello } from "./servers/trello.js";
// Batch 2: Data/Database
import { snowflake } from "./servers/snowflake.js";
import { pinecone } from "./servers/pinecone.js";
import { neo4j } from "./servers/neo4j.js";
import { neon } from "./servers/neon.js";
import { dynamodb } from "./servers/dynamodb.js";
// Batch 2: Documentation/Security
import { confluence } from "./servers/confluence.js";
import { snyk } from "./servers/snyk.js";
import { vault } from "./servers/vault.js";
// Batch 3: Web/AI/DevOps/Data
import { crawl4ai } from "./servers/crawl4ai.js";
import { browserbase } from "./servers/browserbase.js";
import { apify } from "./servers/apify.js";
import { huggingface } from "./servers/huggingface.js";
import { replicate } from "./servers/replicate.js";
import { datadog } from "./servers/datadog.js";
import { grafana } from "./servers/grafana.js";
import { pagerduty } from "./servers/pagerduty.js";
import { raycast } from "./servers/raycast.js";
import { npmRegistry } from "./servers/npm-registry.js";
import { bigquery } from "./servers/bigquery.js";
import { weaviate } from "./servers/weaviate.js";
// Batch 4: Security/AI/DevOps/Documentation/Web
import { sonarqube } from "./servers/sonarqube.js";
import { langchain } from "./servers/langchain.js";
import { llamaindex } from "./servers/llamaindex.js";
import { togetherAi } from "./servers/together-ai.js";
import { prometheus } from "./servers/prometheus.js";
import { readme } from "./servers/readme.js";
import { swagger } from "./servers/swagger.js";
import { zenrows } from "./servers/zenrows.js";
import { everart } from "./servers/everart.js";
import { everything } from "./servers/everything.js";
import { githubCopilot } from "./servers/github-copilot.js";

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
  // Batch 2
  bitbucket,
  asana,
  clickup,
  trello,
  snowflake,
  pinecone,
  neo4j,
  neon,
  dynamodb,
  confluence,
  snyk,
  vault,
  // Batch 3
  crawl4ai,
  browserbase,
  apify,
  huggingface,
  replicate,
  datadog,
  grafana,
  pagerduty,
  raycast,
  npmRegistry,
  bigquery,
  weaviate,
  // Batch 4
  sonarqube,
  langchain,
  llamaindex,
  togetherAi,
  prometheus,
  readme,
  swagger,
  zenrows,
  everart,
  everything,
  githubCopilot,
};

// ---------------------------------------------------------------------------
// Registry — all servers indexed by ID
// ---------------------------------------------------------------------------

const _registry: Map<string, RegistryEntryType> = new Map();

function register(entry: RegistryEntryType): void {
  RegistryEntry.parse(entry);
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
// Batch 2
register(bitbucket);
register(asana);
register(clickup);
register(trello);
register(snowflake);
register(pinecone);
register(neo4j);
register(neon);
register(dynamodb);
register(confluence);
register(snyk);
register(vault);
// Batch 3
register(crawl4ai);
register(browserbase);
register(apify);
register(huggingface);
register(replicate);
register(datadog);
register(grafana);
register(pagerduty);
register(raycast);
register(npmRegistry);
register(bigquery);
register(weaviate);
// Batch 4
register(sonarqube);
register(langchain);
register(llamaindex);
register(togetherAi);
register(prometheus);
register(readme);
register(swagger);
register(zenrows);
register(everart);
register(everything);
register(githubCopilot);

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

/**
 * Find a registry server that matches a given command+args or package name.
 * Used by the `import` command to match existing configured servers
 * back to known registry entries.
 */
export function findServerByCommand(
  command: string,
  args: string[],
): RegistryEntryType | undefined {
  const argsStr = args.join(" ");

  for (const entry of _registry.values()) {
    const config = entry.config;
    if (!("command" in config)) continue;

    // Match by package name in args
    if (entry.package && argsStr.includes(entry.package)) {
      return entry;
    }

    // Match by command + args pattern
    if (config.command === command && config.args) {
      const entryArgsStr = config.args.join(" ");
      if (argsStr.includes(entryArgsStr) || entryArgsStr.includes(argsStr)) {
        return entry;
      }
    }
  }

  return undefined;
}
