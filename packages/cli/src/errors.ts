/**
 * Custom error classes with actionable remediation messages.
 */
export type CliErrorCode =
  | "CONFIG_PARSE_ERROR"
  | "APP_NOT_DETECTED"
  | "INVALID_APP"
  | "SERVER_NOT_FOUND"
  | "NON_INTERACTIVE";

/**
 * Base class for CLI errors that include remediation steps.
 */
export class CliError extends Error {
  readonly remediation: string;
  readonly code?: CliErrorCode;

  constructor(message: string, remediation: string, code?: CliErrorCode) {
    super(message);
    this.name = "CliError";
    this.remediation = remediation;
    this.code = code;
  }

  format(): string {
    return `${this.message}\n\n  Hint: ${this.remediation}`;
  }
}

/**
 * Thrown when a config file cannot be parsed.
 */
export class ConfigParseError extends CliError {
  readonly filePath: string;

  constructor(filePath: string, cause?: string) {
    const msg = cause
      ? `Failed to parse config file: ${filePath} (${cause})`
      : `Failed to parse config file: ${filePath}`;
    super(
      msg,
      `Check the file for syntax errors, or delete it and re-run the command to create a fresh config.`,
      "CONFIG_PARSE_ERROR",
    );
    this.name = "ConfigParseError";
    this.filePath = filePath;
  }
}

/**
 * Thrown when no AI apps are detected on the system.
 */
export class AppNotDetectedError extends CliError {
  constructor() {
    super(
      "No AI applications detected on this system.",
      `Make sure at least one supported app is installed, or use --app <id> to specify a target manually.`,
      "APP_NOT_DETECTED",
    );
    this.name = "AppNotDetectedError";
  }
}

/**
 * Thrown when a specified app ID is not valid.
 */
export class InvalidAppError extends CliError {
  readonly appId: string;

  constructor(appId: string, validIds: string[]) {
    super(`Unknown app: "${appId}"`, `Valid app IDs: ${validIds.join(", ")}`, "INVALID_APP");
    this.name = "InvalidAppError";
    this.appId = appId;
  }
}

/**
 * Thrown when a server is not found in the registry.
 */
export class ServerNotFoundError extends CliError {
  readonly serverId: string;

  constructor(serverId: string) {
    super(
      `Server "${serverId}" not found in registry.`,
      `Run "getmcp list" to see available servers, or "getmcp find" to search interactively.`,
      "SERVER_NOT_FOUND",
    );
    this.name = "ServerNotFoundError";
    this.serverId = serverId;
  }
}

/**
 * Thrown when a non-interactive mode requires input but can't get it.
 */
export class NonInteractiveError extends CliError {
  constructor(detail: string) {
    super(
      `Cannot prompt for input in non-interactive mode: ${detail}`,
      `Provide the required values via flags. Run "getmcp --help" for usage.`,
      "NON_INTERACTIVE",
    );
    this.name = "NonInteractiveError";
  }
}

/**
 * Format any error for CLI output, using remediation if available.
 */
export function formatError(err: unknown): string {
  if (err instanceof CliError) {
    return err.format();
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
