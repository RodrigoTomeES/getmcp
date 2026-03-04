import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { registryCommand, deriveRegistryName } from "../../src/commands/registry.js";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    step: vi.fn(),
  },
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
  confirm: vi.fn(async () => false),
  select: vi.fn(async () => "bearer"),
  text: vi.fn(async () => "test-user"),
  password: vi.fn(async () => "test-secret"),
  isCancel: vi.fn(() => false),
}));

vi.mock("../../src/registry-config.js", () => ({
  addRegistry: vi.fn(),
  removeRegistry: vi.fn(() => true),
  getAllRegistries: vi.fn(() => [
    {
      name: "official",
      url: "https://registry.modelcontextprotocol.io",
      type: "public",
      priority: 0,
    },
    {
      name: "example",
      url: "https://registry.example.com",
      type: "public",
      priority: 100,
    },
  ]),
  getRegistriesConfigPath: vi.fn(() => "/tmp/test-registries.json"),
  readRegistriesConfig: vi.fn(() => []),
  writeRegistriesConfig: vi.fn(),
  getEffectiveRegistries: vi.fn(() => []),
}));

vi.mock("../../src/credentials.js", () => ({
  storeCredential: vi.fn(),
  removeCredential: vi.fn(() => true),
  resolveCredential: vi.fn(() => null),
  buildAuthHeaders: vi.fn(() => ({ Authorization: "Bearer test-token" })),
  getEnvVarName: vi.fn((name: string) => `GETMCP_REGISTRY_${name.toUpperCase()}_TOKEN`),
  isValidHeaderName: vi.fn(() => true),
}));

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

let consoleSpy: MockInstance;
let consoleErrorSpy: MockInstance;
let exitSpy: MockInstance;
let fetchSpy: MockInstance;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  exitSpy = vi.spyOn(process, "exit").mockImplementation(((code: number) => {
    throw new ExitError(code);
  }) as never);

  fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ pong: true }), { status: 200 }));
});

afterEach(() => {
  consoleSpy.mockRestore();
  consoleErrorSpy.mockRestore();
  exitSpy.mockRestore();
  fetchSpy.mockRestore();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// deriveRegistryName unit tests
// ---------------------------------------------------------------------------

describe("deriveRegistryName", () => {
  it("extracts second-level domain from a subdomain URL", () => {
    expect(deriveRegistryName("https://registry.example.com")).toBe("example");
  });

  it("extracts domain from a root URL", () => {
    expect(deriveRegistryName("https://example.com")).toBe("example");
  });

  it("lowercases the result", () => {
    expect(deriveRegistryName("https://Registry.Example.COM")).toBe("example");
  });

  it("handles deeper subdomains", () => {
    expect(deriveRegistryName("https://my.private.registry.io")).toBe("registry");
  });
});

// ---------------------------------------------------------------------------
// registry add
// ---------------------------------------------------------------------------

describe("registryCommand add", () => {
  it("exits when no URL provided", async () => {
    await expect(registryCommand("add", [], {})).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits on invalid URL", async () => {
    await expect(registryCommand("add", ["not-a-url"], {})).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Invalid URL"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("auto-derives name from hostname when --name not provided", async () => {
    const { addRegistry } = await import("../../src/registry-config.js");

    await registryCommand("add", ["https://registry.example.com"], {});

    expect(addRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ name: "example" }),
      undefined,
      undefined,
    );
  });

  it("uses explicit --name when provided", async () => {
    const { addRegistry } = await import("../../src/registry-config.js");

    await registryCommand("add", ["https://registry.example.com"], { name: "my-reg" });

    expect(addRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my-reg" }),
      undefined,
      undefined,
    );
  });

  it("pings the registry during add", async () => {
    await registryCommand("add", ["https://registry.example.com"], {});

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://registry.example.com/v0.1/ping",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("warns but continues when ping fails", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    const { addRegistry } = await import("../../src/registry-config.js");

    await registryCommand("add", ["https://registry.example.com"], {});

    expect(addRegistry).toHaveBeenCalled();

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("Could not reach"));
  });

  it("strips trailing slash from URL before persisting", async () => {
    const { addRegistry } = await import("../../src/registry-config.js");

    await registryCommand("add", ["https://registry.example.com/"], {});

    expect(addRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://registry.example.com" }),
      undefined,
      undefined,
    );
  });

  it("defaults type to public", async () => {
    const { addRegistry } = await import("../../src/registry-config.js");

    await registryCommand("add", ["https://registry.example.com"], {});

    expect(addRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "public" }),
      undefined,
      undefined,
    );
  });

  it("sets type to private when --type private is passed", async () => {
    const { addRegistry } = await import("../../src/registry-config.js");
    const { confirm } = await import("@clack/prompts");
    (confirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    await registryCommand("add", ["https://registry.example.com"], { type: "private" });

    expect(addRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "private" }),
      undefined,
      undefined,
    );
  });

  it("offers login prompt for private registry type", async () => {
    const { confirm } = await import("@clack/prompts");
    (confirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    await registryCommand("add", ["https://private.example.com"], { type: "private" });

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("log in") }),
    );
  });

  it("calls login flow when user confirms login after add", async () => {
    const { getAllRegistries } = await import("../../src/registry-config.js");
    const { confirm, select, password } = await import("@clack/prompts");
    const { storeCredential } = await import("../../src/credentials.js");

    (getAllRegistries as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      { name: "example", url: "https://private.example.com", type: "private", priority: 100 },
    ]);
    (confirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("bearer");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("my-token");

    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("add", ["https://private.example.com"], {
      type: "private",
      name: "example",
    });

    expect(storeCredential).toHaveBeenCalledWith("example", {
      method: "bearer",
      token: "my-token",
    });
  });

  it("exits and shows error when addRegistry throws", async () => {
    const { addRegistry } = await import("../../src/registry-config.js");
    (addRegistry as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error("A registry named example already exists.");
    });

    await expect(registryCommand("add", ["https://registry.example.com"], {})).rejects.toThrow(
      ExitError,
    );

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining("A registry named example already exists."),
    );
  });
});

// ---------------------------------------------------------------------------
// registry remove
// ---------------------------------------------------------------------------

describe("registryCommand remove", () => {
  it("exits when no name provided", async () => {
    await expect(registryCommand("remove", [], {})).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("throws when name is 'official' (reserved)", async () => {
    await expect(registryCommand("remove", ["official"], {})).rejects.toThrow(
      /official.*reserved|reserved.*official/i,
    );
  });

  it("calls removeRegistry and removeCredential on success", async () => {
    const { removeRegistry } = await import("../../src/registry-config.js");
    const { removeCredential } = await import("../../src/credentials.js");

    await registryCommand("remove", ["example"], {});

    expect(removeRegistry).toHaveBeenCalledWith("example");
    expect(removeCredential).toHaveBeenCalledWith("example");
  });

  it("throws when registry name is not found", async () => {
    const { removeRegistry } = await import("../../src/registry-config.js");
    (removeRegistry as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

    await expect(registryCommand("remove", ["nonexistent"], {})).rejects.toThrow(
      /Registry "nonexistent" not found/,
    );
  });

  it("shows success message after removal", async () => {
    await registryCommand("remove", ["example"], {});

    const { log } = await import("@clack/prompts");
    expect(log.success).toHaveBeenCalledWith(expect.stringContaining('"example"'));
  });
});

// ---------------------------------------------------------------------------
// registry list
// ---------------------------------------------------------------------------

describe("registryCommand list", () => {
  it("lists all registries in human-readable format", async () => {
    await registryCommand("list", [], {});

    const { log } = await import("@clack/prompts");
    // Should have called log.info for each of the 2 default registries
    expect(log.info).toHaveBeenCalledTimes(2);
  });

  it("outputs valid JSON with --json flag", async () => {
    await registryCommand("list", [], { json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it("JSON output includes required fields", async () => {
    await registryCommand("list", [], { json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output) as Array<Record<string, unknown>>;
    const official = parsed.find((r) => r["name"] === "official");
    expect(official).toBeDefined();
    expect(official).toHaveProperty("url");
    expect(official).toHaveProperty("type");
    expect(official).toHaveProperty("priority");
    expect(official).toHaveProperty("authenticated");
  });

  it("JSON output shows authenticated: true when credential is resolved", async () => {
    const { resolveCredential } = await import("../../src/credentials.js");
    (resolveCredential as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === "example") return { method: "bearer", token: "tok" };
      return null;
    });

    await registryCommand("list", [], { json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output) as Array<Record<string, unknown>>;
    const example = parsed.find((r) => r["name"] === "example");
    expect(example).toBeDefined();
    expect(example!["authenticated"]).toBe(true);
  });

  it("JSON output shows authenticated: false when no credential", async () => {
    await registryCommand("list", [], { json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output) as Array<Record<string, unknown>>;
    const official = parsed.find((r) => r["name"] === "official");
    expect(official!["authenticated"]).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// registry login
// ---------------------------------------------------------------------------

describe("registryCommand login", () => {
  it("exits when no name provided", async () => {
    await expect(registryCommand("login", [], {})).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("throws when registry does not exist", async () => {
    const { getAllRegistries } = await import("../../src/registry-config.js");
    (getAllRegistries as ReturnType<typeof vi.fn>).mockReturnValueOnce([]);

    await expect(registryCommand("login", ["nonexistent"], {})).rejects.toThrow(
      /Registry "nonexistent" not found/,
    );
  });

  it("stores bearer credential", async () => {
    const { storeCredential } = await import("../../src/credentials.js");
    const { select, password } = await import("@clack/prompts");

    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("bearer");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("my-token");

    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("login", ["example"], {});

    expect(storeCredential).toHaveBeenCalledWith("example", {
      method: "bearer",
      token: "my-token",
    });
  });

  it("stores basic credential", async () => {
    const { storeCredential } = await import("../../src/credentials.js");
    const { select, text, password } = await import("@clack/prompts");

    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("basic");
    (text as ReturnType<typeof vi.fn>).mockResolvedValueOnce("alice");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("secret123");

    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("login", ["example"], {});

    expect(storeCredential).toHaveBeenCalledWith("example", {
      method: "basic",
      username: "alice",
      token: "secret123",
    });
  });

  it("stores header credential", async () => {
    const { storeCredential } = await import("../../src/credentials.js");
    const { select, text, password } = await import("@clack/prompts");

    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("header");
    (text as ReturnType<typeof vi.fn>).mockResolvedValueOnce("X-Api-Key");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("api-key-value");

    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("login", ["example"], {});

    expect(storeCredential).toHaveBeenCalledWith("example", {
      method: "header",
      headerName: "X-Api-Key",
      token: "api-key-value",
    });
  });

  it("uses --method flag when provided, skipping prompt", async () => {
    const { select, password } = await import("@clack/prompts");

    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("tok");
    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("login", ["example"], { method: "bearer" });

    expect(select).not.toHaveBeenCalled();
  });

  it("tests credential against registry /v0.1/servers endpoint", async () => {
    const { select, password } = await import("@clack/prompts");

    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("bearer");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("tok");

    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("login", ["example"], {});

    const calls = fetchSpy.mock.calls as Array<[string, ...unknown[]]>;
    const testCall = calls.find(
      ([url]) => typeof url === "string" && url.includes("/v0.1/servers"),
    );
    expect(testCall).toBeDefined();
  });

  it("warns but still saves credential when auth test fails", async () => {
    const { storeCredential } = await import("../../src/credentials.js");
    const { select, password, log } = await import("@clack/prompts");

    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("bearer");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("wrong-token");

    // login has no ping step — only the auth test fetch call happens
    fetchSpy.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

    await registryCommand("login", ["example"], {});

    expect(storeCredential).toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("Could not verify"));
  });

  it("shows success message after storing credential", async () => {
    const { select, password, log } = await import("@clack/prompts");

    (select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("bearer");
    (password as ReturnType<typeof vi.fn>).mockResolvedValueOnce("tok");
    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));

    await registryCommand("login", ["example"], {});

    expect(log.success).toHaveBeenCalledWith(
      expect.stringContaining('Credentials for "example" stored'),
    );
  });
});

// ---------------------------------------------------------------------------
// registry logout
// ---------------------------------------------------------------------------

describe("registryCommand logout", () => {
  it("exits when no name provided", async () => {
    await expect(registryCommand("logout", [], {})).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("removes credential and shows success", async () => {
    const { removeCredential } = await import("../../src/credentials.js");

    await registryCommand("logout", ["example"], {});

    expect(removeCredential).toHaveBeenCalledWith("example");

    const { log } = await import("@clack/prompts");
    expect(log.success).toHaveBeenCalledWith(
      expect.stringContaining('Credentials for "example" removed'),
    );
  });

  it("shows warning when no credentials were stored", async () => {
    const { removeCredential } = await import("../../src/credentials.js");
    (removeCredential as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

    await registryCommand("logout", ["unknown-reg"], {});

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining('No credentials stored for "unknown-reg"'),
    );
  });
});

// ---------------------------------------------------------------------------
// No subcommand
// ---------------------------------------------------------------------------

describe("registryCommand no subcommand", () => {
  it("prints help when no subcommand provided", async () => {
    await registryCommand(undefined, [], {});

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("getmcp registry");
    expect(output).toContain("add");
    expect(output).toContain("remove");
    expect(output).toContain("list");
    expect(output).toContain("login");
    expect(output).toContain("logout");
  });

  it("prints help for unknown subcommand", async () => {
    await registryCommand("unknown-subcommand", [], {});

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("getmcp registry");
  });
});
