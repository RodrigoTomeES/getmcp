/**
 * Runtime JSON Schema generation from Zod schemas.
 * Uses Zod v4's built-in z.toJSONSchema() to convert RegistryEntry into a standard JSON Schema.
 */

import { z } from "zod";
import { RegistryEntry } from "./schemas.js";

/**
 * Generate a JSON Schema object for the RegistryEntry schema.
 * Useful for external validation tools, IDE autocompletion, and CI pipelines.
 */
export function getRegistryEntryJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(RegistryEntry, {
    target: "draft-07",
    reused: "inline",
  }) as Record<string, unknown>;
}
