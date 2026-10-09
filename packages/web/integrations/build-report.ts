/**
 * Astro integration that reports the size of the static build against the
 * limits of the hosting options we are evaluating. It runs after every
 * `astro build` and writes a Markdown summary to `$GITHUB_STEP_SUMMARY` when
 * running in GitHub Actions.
 *
 * Build time covers `astro:build:start` → `astro:build:done`, so it no longer
 * includes config loading and content sync (reports from before this
 * integration measured the whole `astro build` call).
 */
import { appendFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

const MB = 1024 * 1024;
const GROWTH = 1.2;

type FileInfo = { path: string; size: number };

function walk(root: string, dir: string = root, out: FileInfo[] = []): FileInfo[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(root, full, out);
    else out.push({ path: relative(root, full).split(sep).join("/"), size: statSync(full).size });
  }
  return out;
}

const sum = (files: FileInfo[]) => files.reduce((acc, f) => acc + f.size, 0);
const fmt = (bytes: number) =>
  bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

/** Render the Markdown size report for the build in `dist`. */
export function renderBuildReport(dist: string, buildSeconds?: number): string {
  const files = walk(dist);
  const html = files.filter((f) => f.path.endsWith(".html"));
  const png = files.filter((f) => f.path.endsWith(".png"));
  const other = files.filter((f) => !f.path.endsWith(".html") && !f.path.endsWith(".png"));
  const serverHtml = files.filter((f) => /^servers\/[^/]+\.html$/.test(f.path));
  const serverOg = files.filter((f) => /^servers\/[^/]+\/opengraph-image\.png$/.test(f.path));

  const total = sum(files);
  const serverSizes = serverHtml.map((f) => f.size).sort((a, b) => a - b);
  const largest = files.toSorted((a, b) => b.size - a.size).slice(0, 20);
  const projectedFiles = Math.round(files.length * GROWTH);
  const projectedBytes = total * GROWTH;

  const limits: Array<{ name: string; ok: boolean; projectedOk: boolean; detail: string }> = [
    {
      name: "GitHub Pages (1 GB site)",
      ok: total <= 1024 * MB,
      projectedOk: projectedBytes <= 1024 * MB,
      detail: `${fmt(total)} / 1024 MB`,
    },
    {
      name: "Cloudflare Workers/Pages Free (20k files)",
      ok: files.length <= 20_000,
      projectedOk: projectedFiles <= 20_000,
      detail: `${files.length} / 20000 files`,
    },
    {
      name: "Cloudflare Workers Paid (100k files)",
      ok: files.length <= 100_000,
      projectedOk: projectedFiles <= 100_000,
      detail: `${files.length} / 100000 files`,
    },
    {
      name: "Cloudflare max file size (25 MiB)",
      ok: (largest[0]?.size ?? 0) <= 25 * MB,
      projectedOk: (largest[0]?.size ?? 0) * GROWTH <= 25 * MB,
      detail: `largest ${largest[0]?.path} (${fmt(largest[0]?.size ?? 0)})`,
    },
  ];

  const icon = (ok: boolean) => (ok ? "✅" : "❌");
  const lines = [
    "## Web build size",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Total | ${files.length} files, ${fmt(total)} |`,
    `| HTML | ${html.length} files, ${fmt(sum(html))} |`,
    `| PNG (OG images) | ${png.length} files, ${fmt(sum(png))} |`,
    `| Other (JS, CSS, fonts, XML…) | ${other.length} files, ${fmt(sum(other))} |`,
    `| Server pages | ${serverHtml.length} files — avg ${fmt(sum(serverHtml) / (serverHtml.length || 1))}, p95 ${fmt(percentile(serverSizes, 95))}, max ${fmt(serverSizes.at(-1) ?? 0)} |`,
    `| Server OG images | ${serverOg.length} files, ${fmt(sum(serverOg))} (avg ${fmt(sum(serverOg) / (serverOg.length || 1))}) |`,
    `| Projection (+${Math.round((GROWTH - 1) * 100)}% servers) | ${projectedFiles} files, ${fmt(projectedBytes)} |`,
    ...(buildSeconds !== undefined
      ? [`| Build time | ${(buildSeconds / 60).toFixed(1)} min |`]
      : []),
    "",
    "### Hosting limits",
    "",
    "| Limit | Now | +20% | Detail |",
    "| --- | --- | --- | --- |",
    ...limits.map((l) => `| ${l.name} | ${icon(l.ok)} | ${icon(l.projectedOk)} | ${l.detail} |`),
    "",
    "### Largest files",
    "",
    "| File | Size |",
    "| --- | --- |",
    ...largest.map((f) => `| \`${f.path}\` | ${fmt(f.size)} |`),
    "",
  ];

  return lines.join("\n");
}

export default function buildReport(): AstroIntegration {
  let started: number | undefined;
  return {
    name: "getmcp:build-report",
    hooks: {
      "astro:build:start": () => {
        started = performance.now();
      },
      "astro:build:done": ({ dir, logger }) => {
        const seconds =
          started === undefined ? undefined : Math.round((performance.now() - started) / 1000);
        const report = renderBuildReport(fileURLToPath(dir), seconds);
        logger.info(`\n${report}`);
        if (process.env.GITHUB_STEP_SUMMARY)
          appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
      },
    },
  };
}
