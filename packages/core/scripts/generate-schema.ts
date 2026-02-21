/**
 * Build script: generates registry-entry.schema.json from the Zod schema.
 * Run with: npx tsx scripts/generate-schema.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getRegistryEntryJsonSchema } from "../src/json-schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "..", "registry-entry.schema.json");

const schema = getRegistryEntryJsonSchema();
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2) + "\n", "utf-8");

console.log(`Generated: ${outputPath}`);
