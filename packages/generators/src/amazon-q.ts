/**
 * Amazon Q Developer config generator.
 *
 * Config file: ~/.aws/amazonq/mcp.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Amazon Q uses the same canonical mcpServers format.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

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

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".aws", "amazonq"));
  }
}
