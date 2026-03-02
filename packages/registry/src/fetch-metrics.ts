/**
 * Metrics fetchers for the sync pipeline.
 * Fetches volatile data from GitHub, npm, PyPI, and Docker Hub / GHCR.
 */

import type {
  GetMCPMetricsType,
  NpmMetricsType,
  PyPIMetricsType,
  DockerMetricsType,
} from "./enrichment-types.js";
import { parseGitHubUrl, fetchGitHubRepo } from "./enrich.js";

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  baseDelay = 500,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await fetch(url, options);
    if (resp.ok || resp.status !== 429) return resp;
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
    }
  }
  return new Response(null, { status: 429 });
}

// ---------------------------------------------------------------------------
// npm downloads
// ---------------------------------------------------------------------------

export async function fetchNpmMetrics(packageName: string): Promise<NpmMetricsType | null> {
  try {
    const [downloadsResp, pkgResp] = await Promise.all([
      fetchWithRetry(
        `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`,
      ),
      fetchWithRetry(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`),
    ]);

    if (!downloadsResp.ok) return null;

    const downloads = (await downloadsResp.json()) as { downloads: number };
    let latestVersion: string | undefined;
    let hasTypes: boolean | undefined;

    if (pkgResp.ok) {
      const pkg = (await pkgResp.json()) as {
        version?: string;
        types?: string;
        typings?: string;
      };
      latestVersion = pkg.version;
      hasTypes = !!(pkg.types || pkg.typings);
    }

    return {
      weeklyDownloads: downloads.downloads,
      latestVersion,
      hasTypes,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PyPI stats
// ---------------------------------------------------------------------------

export async function fetchPyPIMetrics(packageName: string): Promise<PyPIMetricsType | null> {
  try {
    const [statsResp, pkgResp] = await Promise.all([
      fetchWithRetry(
        `https://pypistats.org/api/packages/${encodeURIComponent(packageName)}/recent`,
      ),
      fetchWithRetry(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`),
    ]);

    let monthlyDownloads: number | undefined;
    let latestVersion: string | undefined;

    if (statsResp.ok) {
      const stats = (await statsResp.json()) as { data: { last_month: number } };
      monthlyDownloads = stats.data?.last_month;
    }

    if (pkgResp.ok) {
      const pkg = (await pkgResp.json()) as { info: { version: string } };
      latestVersion = pkg.info?.version;
    }

    if (!monthlyDownloads && !latestVersion) return null;

    return { monthlyDownloads, latestVersion };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Docker Hub / GHCR
// ---------------------------------------------------------------------------

/**
 * Fetch metrics for a GHCR (GitHub Container Registry) image.
 * Uses the GitHub Packages API with GITHUB_TOKEN from the environment.
 */
async function fetchGhcrMetrics(imageNoTag: string): Promise<DockerMetricsType | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  // ghcr.io/{owner}/{name} — extract owner and package name
  const match = imageNoTag.match(/^ghcr\.io\/([^/]+)\/(.+)$/);
  if (!match) return null;

  const [, owner, packageName] = match;

  try {
    const resp = await fetchWithRetry(
      `https://api.github.com/users/${owner}/packages/container/${encodeURIComponent(packageName)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!resp.ok) return null;

    // The GitHub Packages API doesn't directly expose pull counts,
    // but we can get version count as a proxy metric
    const data = (await resp.json()) as {
      id: number;
      name: string;
      html_url?: string;
    };

    if (!data.id) return null;

    // Fetch versions to get total download count across all versions
    const versionsResp = await fetchWithRetry(
      `https://api.github.com/users/${owner}/packages/container/${encodeURIComponent(packageName)}/versions?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!versionsResp.ok) return null;

    const versions = (await versionsResp.json()) as Array<{
      metadata?: { container?: { tags?: string[] } };
    }>;

    // Return basic metrics — GHCR doesn't expose pull counts publicly
    return {
      pulls: 0,
      imageSize: undefined,
      ...(versions.length > 0 ? {} : {}),
    };
  } catch {
    return null;
  }
}

export async function fetchDockerMetrics(image: string): Promise<DockerMetricsType | null> {
  try {
    // Strip version tag
    const imageNoTag = image.replace(/:[\w.-]+$/, "");

    // GHCR images — use GitHub Packages API
    if (imageNoTag.startsWith("ghcr.io/")) {
      return fetchGhcrMetrics(imageNoTag);
    }

    // Skip unsupported registries
    if (
      !imageNoTag.startsWith("docker.io/") &&
      imageNoTag.includes(".") &&
      !imageNoTag.includes("/")
    ) {
      return null;
    }

    // Docker Hub — strip docker.io/ prefix if present
    const cleaned = imageNoTag.replace(/^docker\.io\//, "");
    const parts = cleaned.split("/");
    const namespace = parts.length > 1 ? parts[0] : "library";
    const repo = parts.length > 1 ? parts.slice(1).join("/") : parts[0];

    const resp = await fetchWithRetry(
      `https://hub.docker.com/v2/repositories/${namespace}/${repo}/`,
    );
    if (!resp.ok) return null;

    const data = (await resp.json()) as { pull_count: number; full_size?: number };
    return {
      pulls: data.pull_count,
      imageSize: data.full_size,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Combined metrics fetcher
// ---------------------------------------------------------------------------

export interface MetricsFetcherOptions {
  githubToken?: string;
  concurrency?: number;
}

/**
 * Fetch all metrics for a single server entry.
 * Returns null fields on failure (never loses existing data).
 */
export async function fetchMetricsForEntry(
  repositoryUrl?: string,
  packages?: Array<{ registryType: string; identifier: string }>,
  opts?: MetricsFetcherOptions,
): Promise<Omit<GetMCPMetricsType, "fetchedAt"> | null> {
  const results: Omit<GetMCPMetricsType, "fetchedAt"> = {};

  // GitHub metrics from repository URL
  if (repositoryUrl) {
    const parsed = parseGitHubUrl(repositoryUrl);
    if (parsed) {
      const repoInfo = await fetchGitHubRepo(parsed.owner, parsed.repo, opts?.githubToken);
      if (repoInfo) {
        results.github = {
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          openIssues: repoInfo.open_issues_count,
          lastPush: repoInfo.pushed_at,
          archived: repoInfo.archived,
        };
      }
    }
  }

  // Package-specific metrics
  if (packages && packages.length > 0) {
    const pkg = packages[0];

    if (pkg.registryType === "npm") {
      results.npm = (await fetchNpmMetrics(pkg.identifier)) ?? undefined;
    } else if (pkg.registryType === "pypi") {
      results.pypi = (await fetchPyPIMetrics(pkg.identifier)) ?? undefined;
    } else if (pkg.registryType === "oci") {
      results.docker = (await fetchDockerMetrics(pkg.identifier)) ?? undefined;
    }
  }

  // Return null if we got nothing at all
  if (!results.github && !results.npm && !results.pypi && !results.docker) {
    return null;
  }

  return results;
}

/**
 * Run a function with concurrency control.
 */
export async function withConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
