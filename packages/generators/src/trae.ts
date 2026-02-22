/**
 * Trae config generator.
 *
 * Config file: .trae/mcp.json (project-scoped)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Trae uses the same canonical mcpServers format.
 * Project-scoped configuration.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class TraeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "trae",
    name: "Trae",
    description: "ByteDance's AI-powered IDE",
    configPaths: ".trae/mcp.json",
    globalConfigPaths: null,
    configFormat: "json",
    docsUrl: "https://docs.trae.ai/ide/model-context-protocol-mcp",
  };

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".trae"));
  }
}
