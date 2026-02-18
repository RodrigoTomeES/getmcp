/**
 * @getmcp/cli
 *
 * CLI tool to install MCP servers into any AI application.
 * Supports: add, remove, list commands.
 */

export { addCommand } from "./commands/add.js";
export { removeCommand } from "./commands/remove.js";
export { listCommand } from "./commands/list.js";
export { detectApps, detectInstalledApps, resolvePath, getConfigPath } from "./detect.js";
export {
  readConfigFile,
  writeConfigFile,
  mergeServerIntoConfig,
  removeServerFromConfig,
  listServersInConfig,
} from "./config-file.js";
