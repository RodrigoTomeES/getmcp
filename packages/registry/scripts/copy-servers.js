/**
 * Build helper: copies servers/*.json into dist/servers/ so the
 * published package includes the JSON server definitions.
 *
 * Run as part of the build: "tsc && node scripts/copy-servers.js"
 */

import { cpSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "..", "servers");
const dest = resolve(__dirname, "..", "dist", "servers");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

console.log(`Copied servers/*.json → dist/servers/`);
