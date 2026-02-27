/**
 * Build script: copies data/ files to dist/data/ for npm distribution.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "..", "data");
const destDir = path.resolve(__dirname, "..", "dist", "data");

if (!fs.existsSync(srcDir)) {
  console.warn("Warning: data/ directory not found. Run sync first.");
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json"));
for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  console.log(`Copied ${file} to dist/data/`);
}

console.log(`Copied ${files.length} data file(s).`);
