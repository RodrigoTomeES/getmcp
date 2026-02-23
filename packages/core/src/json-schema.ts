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
  const schema = z.toJSONSchema(RegistryEntry, {
    target: "draft-07",
    reused: "inline",
  }) as Record<string, unknown>;

  // Allow "$schema" so JSON files can reference the published schema URL
  // for IDE autocompletion without failing additionalProperties validation.
  const props = schema.properties as Record<string, unknown>;
  props.$schema = { type: "string" };

  return schema;
}
