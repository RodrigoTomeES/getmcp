/**
 * `astro build` + size report. Kept as a script so the build time can be
 * included in the report.
 *
 * Usage: tsx scripts/build.ts [--outDir=<path>]
 *   --outDir  Write the build somewhere other than `dist/` (e.g. a faster disk:
 *             the build writes ~76k files).
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { build } from "astro";

const outDirArg = process.argv.find((a) => a.startsWith("--outDir="));
const outDir = outDirArg ? resolve(outDirArg.slice("--outDir=".length)) : undefined;

const started = performance.now();
await build(outDir ? { outDir } : {});
const seconds = Math.round((performance.now() - started) / 1000);

execFileSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "scripts/measure.ts",
    `--build-seconds=${seconds}`,
    ...(outDir ? [`--dist=${outDir}`] : []),
  ],
  { stdio: "inherit" },
);
