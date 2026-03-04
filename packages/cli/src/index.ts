/**
 * @getmcp/cli
 *
 * CLI tool to install MCP servers into any AI application.
 * Supports: add, remove, list, find, check, update, doctor, import, sync commands.
 */

export { addCommand } from "./commands/add.js";
export { removeCommand } from "./commands/remove.js";
export { listCommand } from "./commands/list.js";
export { findCommand } from "./commands/find.js";
export { checkCommand } from "./commands/check.js";
export { updateCommand } from "./commands/update.js";
export { detectApps, detectInstalledApps, resolveAppForScope } from "./detect.js";
export {
  readConfigFile,
  writeConfigFile,
  mergeServerIntoConfig,
  removeServerFromConfig,
  listServersInConfig,
} from "./config-file.js";
export {
  getPreferencesPath,
  readPreferences,
  saveSelectedApps,
  getSavedSelectedApps,
} from "./preferences.js";
export {
  readLockFile,
  writeLockFile,
  trackInstallation,
  trackRemoval,
  getTrackedServers,
  getLockFilePath,
} from "./lock.js";
export { shortenPath, parseFlags, resolveAlias } from "./utils.js";
export {
  CliError,
  ConfigParseError,
  AppNotDetectedError,
  InvalidAppError,
  ServerNotFoundError,
  NonInteractiveError,
  formatError,
} from "./errors.js";
export { registryCommand } from "./commands/registry.js";
export {
  addRegistry,
  removeRegistry,
  getAllRegistries,
  getEffectiveRegistries,
  getRegistriesConfigPath,
} from "./registry-config.js";
export {
  storeCredential,
  removeCredential,
  resolveCredential,
  buildAuthHeaders,
  getCredentialStorePath,
} from "./credentials.js";
export {
  initRegistryCache,
  refreshRegistryCache,
  clearRegistryCache,
  getRegistryCacheDir,
} from "./registry-cache.js";
