/**
 * Report the size of the static build in `dist/` against the limits of the
 * hosting options we are evaluating. Run after `astro build` (the `build`
 * script does this automatically). Writes a Markdown summary to
 * `$GITHUB_STEP_SUMMARY` when running in GitHub Actions.
 *
 * Usage: tsx scripts/measure.ts [--build-seconds=<n>] [--dist=<path>]
 */
import { appendFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const distArg = process.argv.find((a) => a.startsWith("--dist="));
const DIST = distArg
  ? resolve(distArg.slice("--dist=".length))
  : join(import.meta.dirname, "..", "dist");
const MB = 1024 * 1024;
const GROWTH = 1.2;

type FileInfo = { path: string; size: number };

function walk(dir: string, out: FileInfo[] = []): FileInfo[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push({ path: relative(DIST, full).split(sep).join("/"), size: statSync(full).size });
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

const buildSecondsArg = process.argv.find((a) => a.startsWith("--build-seconds="));
const buildSeconds = buildSecondsArg ? Number(buildSecondsArg.split("=")[1]) : undefined;

const files = walk(DIST);
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
  ...(buildSeconds !== undefined ? [`| Build time | ${(buildSeconds / 60).toFixed(1)} min |`] : []),
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

const report = lines.join("\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
