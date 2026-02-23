/**
 * Build helper: validates every servers/*.json file against the
 * RegistryEntry Zod schema before compilation proceeds.
 *
 * Run as part of the build: "node scripts/validate-servers.js && tsc && ..."
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RegistryEntry } from "@getmcp/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serversDir = resolve(__dirname, "..", "servers");

const files = readdirSync(serversDir).filter((f) => f.endsWith(".json"));

let errors = 0;

for (const file of files) {
  const filePath = resolve(serversDir, file);
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const { $schema: _, ...data } = raw;
    const entry = RegistryEntry.parse(data);

    const expectedFile = `${entry.id}.json`;
    if (file !== expectedFile) {
      console.error(
        `  FAIL ${file}: filename mismatch (id="${entry.id}", expected "${expectedFile}")`,
      );
      errors++;
      continue;
    }
  } catch (err) {
    console.error(`  FAIL ${file}: ${err.message}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} server(s) failed validation.`);
  process.exit(1);
} else {
  console.log(`All ${files.length} server(s) validated successfully.`);
}
