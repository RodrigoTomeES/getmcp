/**
 * Amazon Q Developer config generator.
 *
 * Config file: ~/.aws/amazonq/mcp.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Amazon Q uses the same canonical mcpServers format.
 */

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields, home, safeExistsSync } from "./base.js";

export class AmazonQGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "amazon-q",
    name: "Amazon Q Developer",
    description: "AWS AI coding assistant",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/.aws/amazonq/mcp.json",
      win32: "%UserProfile%\\.aws\\amazonq\\mcp.json",
      linux: "~/.aws/amazonq/mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/mcp.html",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = toStdioFields(config);
    } else if (isRemoteConfig(config)) {
      serverConfig = toRemoteFields(config);
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      mcpServers: {
        [serverName]: serverConfig,
      },
    };
  }

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".aws", "amazonq"));
  }
}
