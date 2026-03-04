/**
 * Registry configuration persistence.
 *
 * Stores user-defined custom registry sources globally.
 * The official registry is never stored — it is always injected at runtime.
 *
 * Stored in a platform-specific config directory:
 *   - Windows: %AppData%/getmcp/registries.json
 *   - macOS/Linux: ~/.config/getmcp/registries.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Local schema (mirrors @getmcp/core RegistrySource)
// ---------------------------------------------------------------------------

/**
 * Zod schema for a registry source.
 * Mirrors the RegistrySource schema in @getmcp/core — kept local here so
 * this module does not depend on the compiled dist being up-to-date.
 */
const RegistrySourceSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  url: z.string().url(),
  type: z.enum(["public", "private"]).default("public"),
  priority: z.number().int().nonnegative().default(100),
});

export type RegistrySourceType = z.infer<typeof RegistrySourceSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OFFICIAL_REGISTRY_NAME = "official";

/**
 * The official MCP registry, always present and injected at runtime.
 * It is never written to the config file.
 */
const OFFICIAL_REGISTRY: RegistrySourceType = {
  name: OFFICIAL_REGISTRY_NAME,
  url: "https://registry.modelcontextprotocol.io",
  type: "public",
  priority: 0,
};

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Get the platform-specific path for the registries config file.
 */
export function getRegistriesConfigPath(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "getmcp", "registries.json");
  }

  // macOS and Linux: use XDG_CONFIG_HOME or ~/.config
  const configDir = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(configDir, "getmcp", "registries.json");
}

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

/**
 * Read and validate the registries config file.
 * Returns an empty array if the file is missing or corrupt.
 * The official registry is never stored here and will not appear in the result.
 */
export function readRegistriesConfig(filePath?: string): RegistrySourceType[] {
  const configPath = filePath ?? getRegistriesConfigPath();

  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    if (!raw.trim()) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    const result = RegistrySourceSchema.array().safeParse(parsed);
    if (!result.success) return [];

    return result.data;
  } catch {
    return [];
  }
}

/**
 * Atomically write a registries config array to disk.
 * Creates parent directories if they do not exist.
 * The official registry must not be present in the array — it is always
 * injected at runtime and must never be persisted.
 */
export function writeRegistriesConfig(config: RegistrySourceType[], filePath?: string): void {
  const configPath = filePath ?? getRegistriesConfigPath();

  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = configPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  fs.renameSync(tmpPath, configPath);
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

/**
 * Add a new registry source to the global config.
 *
 * Throws if:
 *   - The name is "official" (reserved).
 *   - A registry with the same name already exists.
 *   - The source fails Zod validation.
 */
export function addRegistry(source: RegistrySourceType, filePath?: string): void {
  if (source.name === OFFICIAL_REGISTRY_NAME) {
    throw new Error(
      `"official" is a reserved registry name and cannot be used for custom registries.`,
    );
  }

  // Validate the incoming source through the schema
  const parsed = RegistrySourceSchema.parse(source);

  const existing = readRegistriesConfig(filePath);

  const duplicate = existing.find((r) => r.name === parsed.name);
  if (duplicate) {
    throw new Error(
      `A registry named "${parsed.name}" already exists. Remove it first before adding a new one with the same name.`,
    );
  }

  existing.push(parsed);
  writeRegistriesConfig(existing, filePath);
}

/**
 * Remove a registry source by name from the global config.
 *
 * Returns true if the registry was found and removed, false if it was not found.
 * Throws if the name is "official" (reserved).
 */
export function removeRegistry(name: string, filePath?: string): boolean {
  if (name === OFFICIAL_REGISTRY_NAME) {
    throw new Error(`"official" is a reserved registry name and cannot be removed.`);
  }

  const existing = readRegistriesConfig(filePath);
  const index = existing.findIndex((r) => r.name === name);

  if (index === -1) {
    return false;
  }

  existing.splice(index, 1);
  writeRegistriesConfig(existing, filePath);
  return true;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Get all registries: official (always first) plus any custom global ones,
 * sorted by priority ascending (lower number = higher priority).
 */
export function getAllRegistries(filePath?: string): RegistrySourceType[] {
  const custom = readRegistriesConfig(filePath);
  return [OFFICIAL_REGISTRY, ...custom].sort((a, b) => a.priority - b.priority);
}

/**
 * Merge project-level registries with global ones.
 *
 * Merge rules:
 *   - The official registry is always present.
 *   - Project registries with the same name as a global registry override
 *     the global entry.
 *   - Registries present only in the global config are included as-is.
 *   - Sorted by priority ascending.
 */
export function getEffectiveRegistries(
  projectRegistries?: RegistrySourceType[],
  globalFilePath?: string,
): RegistrySourceType[] {
  const global = getAllRegistries(globalFilePath);

  if (!projectRegistries || projectRegistries.length === 0) {
    return global;
  }

  // Build a map of project registries keyed by name for O(1) lookup
  const projectByName = new Map<string, RegistrySourceType>(
    projectRegistries.map((r) => [r.name, r]),
  );

  // Start with global registries, replaced by project overrides where names match
  const merged = new Map<string, RegistrySourceType>(global.map((r) => [r.name, r]));

  for (const [name, reg] of projectByName) {
    // The official registry cannot be overridden at the project level
    if (name === OFFICIAL_REGISTRY_NAME) continue;
    merged.set(name, reg);
  }

  return Array.from(merged.values()).sort((a, b) => a.priority - b.priority);
}
