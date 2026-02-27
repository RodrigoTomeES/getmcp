/**
 * Extract canonical ServerConfig from the official MCP registry format.
 * Transforms packages[]/remotes[] into StdioServerConfig | RemoteServerConfig.
 */

type RegistryEntryType = import("@getmcp/core").RegistryEntryType;
type LooseServerConfigType = import("@getmcp/core").LooseServerConfigType;

export interface ExtractedConfig {
  config: LooseServerConfigType;
  requiredEnvVars: string[];
  envVarDetails: Array<{
    name: string;
    description?: string;
    isSecret?: boolean;
    isRequired?: boolean;
  }>;
}

/**
 * Extract a canonical server config from an official-format registry entry.
 * Tries packages[0] first (stdio), then remotes[0] (http/sse).
 * Returns null if the entry has no installable config.
 */
export function extractServerConfig(entry: RegistryEntryType): ExtractedConfig | null {
  const server = entry.server;

  // Try packages first (stdio-based servers)
  if (server.packages && server.packages.length > 0) {
    const pkg = server.packages[0];
    return extractFromPackage(pkg);
  }

  // Try remotes (hosted servers)
  if (server.remotes && server.remotes.length > 0) {
    const remote = server.remotes[0];
    return extractFromRemote(remote);
  }

  return null;
}

function extractFromPackage(
  pkg: NonNullable<RegistryEntryType["server"]["packages"]>[number],
): ExtractedConfig {
  const envVarDetails: ExtractedConfig["envVarDetails"] = [];
  const env: Record<string, string> = {};
  const requiredEnvVars: string[] = [];

  // Extract environment variables
  if (pkg.environmentVariables) {
    for (const ev of pkg.environmentVariables) {
      envVarDetails.push({
        name: ev.name,
        description: ev.description,
        isSecret: ev.isSecret,
        isRequired: ev.isRequired,
      });
      env[ev.name] = ev.value ?? ev.default ?? "";
      if (ev.isRequired) {
        requiredEnvVars.push(ev.name);
      }
    }
  }

  // Build args
  const args: string[] = [];

  // Add runtime arguments first
  if (pkg.runtimeArguments) {
    for (const arg of pkg.runtimeArguments) {
      if (arg.value) args.push(arg.value);
      else if (arg.default) args.push(arg.default);
    }
  }

  // Determine command and package-specific args based on registry type
  let command: string;
  switch (pkg.registryType) {
    case "npm": {
      command = pkg.runtimeHint || "npx";
      if (command === "npx") args.push("-y");
      args.push(pkg.identifier);
      break;
    }
    case "pypi": {
      command = pkg.runtimeHint || "uvx";
      args.push(pkg.identifier);
      break;
    }
    case "oci": {
      command = pkg.runtimeHint || "docker";
      args.push("run", "-i", "--rm");
      // Add env flags for docker
      for (const name of Object.keys(env)) {
        args.push("-e", name);
      }
      args.push(pkg.identifier);
      break;
    }
    default: {
      // nuget, mcpb, etc.
      command = pkg.runtimeHint || pkg.identifier;
      break;
    }
  }

  // Add package arguments
  if (pkg.packageArguments) {
    for (const arg of pkg.packageArguments) {
      if (arg.value) args.push(arg.value);
      else if (arg.default) args.push(arg.default);
    }
  }

  const config: LooseServerConfigType = {
    command,
    args,
    env: Object.keys(env).length > 0 ? env : {},
    transport: "stdio" as const,
  };

  return { config, requiredEnvVars, envVarDetails };
}

function extractFromRemote(
  remote: NonNullable<RegistryEntryType["server"]["remotes"]>[number],
): ExtractedConfig {
  const headers: Record<string, string> = {};
  const envVarDetails: ExtractedConfig["envVarDetails"] = [];
  const requiredEnvVars: string[] = [];

  if (remote.headers) {
    for (const h of remote.headers) {
      headers[h.name] = h.value ?? h.default ?? "";
      if (h.isRequired) {
        envVarDetails.push({
          name: h.name,
          description: h.description,
          isSecret: h.isSecret,
          isRequired: h.isRequired,
        });
        requiredEnvVars.push(h.name);
      }
    }
  }

  const transport = remote.type === "sse" ? "sse" : "streamable-http";

  const config: LooseServerConfigType = {
    url: remote.url,
    transport: transport as "sse" | "streamable-http",
    headers: Object.keys(headers).length > 0 ? headers : {},
  };

  return { config, requiredEnvVars, envVarDetails };
}
