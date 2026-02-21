/**
 * Runtime JSON Schema generation from Zod schemas.
 * Uses zod-to-json-schema to convert RegistryEntry into a standard JSON Schema.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { RegistryEntry } from "./schemas.js";

/**
 * Generate a JSON Schema object for the RegistryEntry schema.
 * Useful for external validation tools, IDE autocompletion, and CI pipelines.
 */
export function getRegistryEntryJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(RegistryEntry, {
    $refStrategy: "none",
  }) as Record<string, unknown>;
}
