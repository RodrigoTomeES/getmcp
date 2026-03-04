import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { RegistryCredentialType } from "@getmcp/core";
import {
  getCredentialStorePath,
  storeCredential,
  removeCredential,
  resolveCredential,
  getEnvVarName,
  buildAuthHeaders,
} from "../src/credentials.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-creds-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

function tmpFile(name: string): string {
  return path.join(tmpDir, name);
}

// ---------------------------------------------------------------------------
// getCredentialStorePath
// ---------------------------------------------------------------------------

describe("getCredentialStorePath", () => {
  it("returns a path ending with credentials.json inside a getmcp directory", () => {
    const p = getCredentialStorePath();
    expect(path.basename(p)).toBe("credentials.json");
    expect(path.basename(path.dirname(p))).toBe("getmcp");
  });

  it("returns an absolute path", () => {
    const p = getCredentialStorePath();
    expect(path.isAbsolute(p)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getEnvVarName
// ---------------------------------------------------------------------------

describe("getEnvVarName", () => {
  it("converts a simple name to uppercase", () => {
    expect(getEnvVarName("myregistry")).toBe("GETMCP_REGISTRY_MYREGISTRY_TOKEN");
  });

  it("replaces hyphens with underscores and uppercases", () => {
    expect(getEnvVarName("my-registry")).toBe("GETMCP_REGISTRY_MY_REGISTRY_TOKEN");
  });

  it("handles multiple hyphens", () => {
    expect(getEnvVarName("my-private-registry")).toBe("GETMCP_REGISTRY_MY_PRIVATE_REGISTRY_TOKEN");
  });

  it("handles already uppercase input", () => {
    expect(getEnvVarName("MYREGISTRY")).toBe("GETMCP_REGISTRY_MYREGISTRY_TOKEN");
  });

  it("handles single-character name", () => {
    expect(getEnvVarName("a")).toBe("GETMCP_REGISTRY_A_TOKEN");
  });
});

// ---------------------------------------------------------------------------
// storeCredential
// ---------------------------------------------------------------------------

describe("storeCredential", () => {
  it("stores a bearer credential and it can be read back", () => {
    const f = tmpFile("creds.json");
    const cred: RegistryCredentialType = { method: "bearer", token: "tok-abc" };

    storeCredential("acme", cred, f);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["acme"]).toMatchObject({ method: "bearer", token: "tok-abc" });
  });

  it("creates parent directories when they do not exist", () => {
    const f = path.join(tmpDir, "nested", "deep", "creds.json");
    storeCredential("acme", { method: "bearer", token: "t" }, f);
    expect(fs.existsSync(f)).toBe(true);
  });

  it("upserts an existing credential without removing others", () => {
    const f = tmpFile("creds.json");
    storeCredential("reg-a", { method: "bearer", token: "aaa" }, f);
    storeCredential("reg-b", { method: "bearer", token: "bbb" }, f);

    // Overwrite reg-a
    storeCredential("reg-a", { method: "bearer", token: "new-aaa" }, f);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["reg-a"].token).toBe("new-aaa");
    expect(raw["reg-b"].token).toBe("bbb");
  });

  it("stores a basic credential with username", () => {
    const f = tmpFile("creds.json");
    const cred: RegistryCredentialType = { method: "basic", username: "alice", token: "secret" };

    storeCredential("corp", cred, f);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["corp"]).toMatchObject({ method: "basic", username: "alice", token: "secret" });
  });

  it("stores a header credential", () => {
    const f = tmpFile("creds.json");
    const cred: RegistryCredentialType = {
      method: "header",
      headerName: "X-Api-Key",
      token: "apikey123",
    };

    storeCredential("custom", cred, f);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["custom"]).toMatchObject({
      method: "header",
      headerName: "X-Api-Key",
      token: "apikey123",
    });
  });

  it("sets 0o600 permissions on non-Windows", () => {
    if (process.platform === "win32") return;

    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "bearer", token: "t" }, f);

    const stat = fs.statSync(f);
    // eslint-disable-next-line no-bitwise
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("uses atomic write (file exists atomically after call)", () => {
    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "bearer", token: "t" }, f);

    // No .tmp artifact should remain
    expect(fs.existsSync(`${f}.tmp`)).toBe(false);
    expect(fs.existsSync(f)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeCredential
// ---------------------------------------------------------------------------

describe("removeCredential", () => {
  it("returns false when the store file does not exist", () => {
    expect(removeCredential("unknown", tmpFile("missing.json"))).toBe(false);
  });

  it("returns false when the registry name is not in the store", () => {
    const f = tmpFile("creds.json");
    storeCredential("reg-a", { method: "bearer", token: "aaa" }, f);
    expect(removeCredential("reg-b", f)).toBe(false);
  });

  it("returns true and removes the credential when found", () => {
    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "bearer", token: "t" }, f);

    const result = removeCredential("acme", f);
    expect(result).toBe(true);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["acme"]).toBeUndefined();
  });

  it("does not remove other credentials when removing one", () => {
    const f = tmpFile("creds.json");
    storeCredential("reg-a", { method: "bearer", token: "aaa" }, f);
    storeCredential("reg-b", { method: "bearer", token: "bbb" }, f);

    removeCredential("reg-a", f);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["reg-a"]).toBeUndefined();
    expect(raw["reg-b"]).toBeDefined();
  });

  it("returns false when removing the same credential twice", () => {
    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "bearer", token: "t" }, f);

    removeCredential("acme", f);
    expect(removeCredential("acme", f)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveCredential
// ---------------------------------------------------------------------------

describe("resolveCredential", () => {
  it("returns null when no env var and no stored credential", () => {
    const result = resolveCredential("unknown-reg", tmpFile("missing.json"));
    expect(result).toBeNull();
  });

  it("returns a bearer credential from the env var when set", () => {
    vi.stubEnv("GETMCP_REGISTRY_ACME_TOKEN", "env-token-xyz");

    const result = resolveCredential("acme", tmpFile("missing.json"));
    expect(result).toEqual({ method: "bearer", token: "env-token-xyz" });
  });

  it("prefers env var over stored credential", () => {
    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "basic", username: "bob", token: "stored-tok" }, f);

    vi.stubEnv("GETMCP_REGISTRY_ACME_TOKEN", "env-wins");

    const result = resolveCredential("acme", f);
    expect(result).toEqual({ method: "bearer", token: "env-wins" });
  });

  it("returns stored credential when no env var is set", () => {
    const f = tmpFile("creds.json");
    const cred: RegistryCredentialType = { method: "bearer", token: "stored-abc" };
    storeCredential("acme", cred, f);

    const result = resolveCredential("acme", f);
    expect(result).toMatchObject({ method: "bearer", token: "stored-abc" });
  });

  it("handles env var name conversion with hyphens", () => {
    vi.stubEnv("GETMCP_REGISTRY_MY_PRIVATE_REGISTRY_TOKEN", "hyphen-token");

    const result = resolveCredential("my-private-registry", tmpFile("missing.json"));
    expect(result).toEqual({ method: "bearer", token: "hyphen-token" });
  });

  it("returns null for corrupt credentials file (graceful degradation)", () => {
    const f = tmpFile("corrupt.json");
    fs.writeFileSync(f, "{{invalid json}}", "utf-8");
    expect(resolveCredential("acme", f)).toBeNull();
  });

  it("returns null for a credential file that contains an array", () => {
    const f = tmpFile("array.json");
    fs.writeFileSync(f, '["not", "an", "object"]', "utf-8");
    expect(resolveCredential("acme", f)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildAuthHeaders
// ---------------------------------------------------------------------------

describe("buildAuthHeaders", () => {
  it("returns empty object when no credential found", () => {
    expect(buildAuthHeaders("unknown", tmpFile("missing.json"))).toEqual({});
  });

  it("returns Bearer Authorization header for bearer credential", () => {
    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "bearer", token: "my-token" }, f);

    expect(buildAuthHeaders("acme", f)).toEqual({
      Authorization: "Bearer my-token",
    });
  });

  it("returns Basic Authorization header with base64-encoded credentials", () => {
    const f = tmpFile("creds.json");
    storeCredential("corp", { method: "basic", username: "alice", token: "secret" }, f);

    const headers = buildAuthHeaders("corp", f);
    const expected = Buffer.from("alice:secret").toString("base64");
    expect(headers).toEqual({ Authorization: `Basic ${expected}` });
  });

  it("uses empty username for basic auth when username is not set", () => {
    const f = tmpFile("creds.json");
    storeCredential("corp", { method: "basic", token: "secret" }, f);

    const headers = buildAuthHeaders("corp", f);
    const expected = Buffer.from(":secret").toString("base64");
    expect(headers).toEqual({ Authorization: `Basic ${expected}` });
  });

  it("returns custom header for header credential", () => {
    const f = tmpFile("creds.json");
    storeCredential("custom", { method: "header", headerName: "X-Api-Key", token: "key123" }, f);

    expect(buildAuthHeaders("custom", f)).toEqual({ "X-Api-Key": "key123" });
  });

  it("returns empty object for bearer credential with no token", () => {
    const f = tmpFile("creds.json");
    // Write a raw entry without a token to exercise the guard
    fs.writeFileSync(f, JSON.stringify({ reg: { method: "bearer" } }), "utf-8");

    expect(buildAuthHeaders("reg", f)).toEqual({});
  });

  it("returns empty object for header credential with no headerName", () => {
    const f = tmpFile("creds.json");
    fs.writeFileSync(f, JSON.stringify({ reg: { method: "header", token: "t" } }), "utf-8");

    expect(buildAuthHeaders("reg", f)).toEqual({});
  });

  it("uses env var credential for Bearer headers", () => {
    vi.stubEnv("GETMCP_REGISTRY_ACME_TOKEN", "env-bearer-tok");

    expect(buildAuthHeaders("acme", tmpFile("missing.json"))).toEqual({
      Authorization: "Bearer env-bearer-tok",
    });
  });
});

// ---------------------------------------------------------------------------
// File permissions
// ---------------------------------------------------------------------------

describe("file permissions", () => {
  it("credentials file has 0o600 mode on non-Windows", () => {
    if (process.platform === "win32") return;

    const f = tmpFile("creds.json");
    storeCredential("acme", { method: "bearer", token: "tok" }, f);

    const stat = fs.statSync(f);
    // eslint-disable-next-line no-bitwise
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("permissions are preserved after an upsert", () => {
    if (process.platform === "win32") return;

    const f = tmpFile("creds.json");
    storeCredential("reg-a", { method: "bearer", token: "aaa" }, f);
    storeCredential("reg-b", { method: "bearer", token: "bbb" }, f);

    const stat = fs.statSync(f);
    // eslint-disable-next-line no-bitwise
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });
});

// ---------------------------------------------------------------------------
// Graceful degradation
// ---------------------------------------------------------------------------

describe("graceful degradation", () => {
  it("storeCredential works after a corrupt file (overwrites it)", () => {
    const f = tmpFile("corrupt.json");
    fs.writeFileSync(f, "{{not json}}", "utf-8");

    // Should not throw; treats corrupt file as empty store
    storeCredential("acme", { method: "bearer", token: "t" }, f);

    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw["acme"]).toBeDefined();
  });

  it("removeCredential returns false for empty/corrupt file", () => {
    const f = tmpFile("corrupt.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(removeCredential("acme", f)).toBe(false);
  });

  it("invalid credential entries in the file are silently skipped", () => {
    const f = tmpFile("mixed.json");
    // "bad" entry fails Zod validation, "good" passes
    fs.writeFileSync(
      f,
      JSON.stringify({ bad: { method: "unknown-method" }, good: { method: "bearer", token: "t" } }),
      "utf-8",
    );

    const result = resolveCredential("good", f);
    expect(result).toMatchObject({ method: "bearer", token: "t" });

    expect(resolveCredential("bad", f)).toBeNull();
  });

  it("resolveCredential returns null for empty credentials file", () => {
    const f = tmpFile("empty.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(resolveCredential("acme", f)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it("store then resolve returns the same credential", () => {
    const f = tmpFile("roundtrip.json");
    const cred: RegistryCredentialType = { method: "bearer", token: "round-trip-token" };

    storeCredential("acme", cred, f);
    const resolved = resolveCredential("acme", f);

    expect(resolved).toMatchObject(cred);
  });

  it("store, remove, then resolve returns null", () => {
    const f = tmpFile("roundtrip.json");
    storeCredential("acme", { method: "bearer", token: "t" }, f);
    removeCredential("acme", f);

    expect(resolveCredential("acme", f)).toBeNull();
  });

  it("multiple registries round-trip independently", () => {
    const f = tmpFile("multi.json");

    storeCredential("reg-a", { method: "bearer", token: "aaa" }, f);
    storeCredential("reg-b", { method: "basic", username: "u", token: "bbb" }, f);
    storeCredential("reg-c", { method: "header", headerName: "X-Key", token: "ccc" }, f);

    expect(resolveCredential("reg-a", f)).toMatchObject({ method: "bearer", token: "aaa" });
    expect(resolveCredential("reg-b", f)).toMatchObject({ method: "basic", token: "bbb" });
    expect(resolveCredential("reg-c", f)).toMatchObject({ method: "header", token: "ccc" });
  });
});
