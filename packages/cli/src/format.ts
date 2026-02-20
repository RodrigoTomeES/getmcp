/**
 * Config file format detection based on file extension.
 *
 * Used by readConfigFile/writeConfigFile to dispatch to the correct
 * parser/serializer for JSON, JSONC, YAML, and TOML formats.
 */

import * as path from "node:path";

export type ConfigFormat = "json" | "jsonc" | "yaml" | "toml";

/**
 * Detect the config file format from its file extension.
 *
 * @param filePath - Path to the config file
 * @returns The detected format, defaults to "json" for unknown extensions
 */
export function detectConfigFormat(filePath: string): ConfigFormat {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".json":
      return "json";
    case ".jsonc":
      return "jsonc";
    case ".yaml":
    case ".yml":
      return "yaml";
    case ".toml":
      return "toml";
    default:
      return "json";
  }
}
