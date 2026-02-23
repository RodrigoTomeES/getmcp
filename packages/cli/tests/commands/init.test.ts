import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { initCommand } from "../../src/commands/init.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(() => []),
  confirm: vi.fn(() => true),
  isCancel: vi.fn(() => false),
}));

let exitSpy: ReturnType<typeof vi.spyOn>;
let tmpDir: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-init-test-"));
  // initCommand defaults to path.resolve(".") which resolves relative to cwd
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
});

afterEach(() => {
  exitSpy.mockRestore();
  cwdSpy.mockRestore();
  vi.clearAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// initCommand
// ---------------------------------------------------------------------------

describe("initCommand", () => {
  it("scaffolds a stdio server entry from prompted values", async () => {
    const p = await import("@clack/prompts");

    // Mock prompt responses in sequence
    const textMock = p.text as ReturnType<typeof vi.fn>;
    textMock
      .mockResolvedValueOnce("my-server") // id
      .mockResolvedValueOnce("My Server") // name
      .mockResolvedValueOnce("A test server") // description
      .mockResolvedValueOnce("npx") // command
      .mockResolvedValueOnce("-y my-server") // args
      .mockResolvedValueOnce("API_KEY") // env vars
      .mockResolvedValueOnce("https://github.com/user/repo") // repository
      .mockResolvedValueOnce("https://example.com") // homepage
      .mockResolvedValueOnce("Author"); // author

    (p.select as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce("stdio") // transport
      .mockResolvedValueOnce("node"); // runtime

    (p.multiselect as ReturnType<typeof vi.fn>).mockResolvedValueOnce(["developer-tools"]);

    await initCommand();

    const outputFile = path.join(tmpDir, "my-server.json");
    expect(fs.existsSync(outputFile)).toBe(true);

    const content = fs.readFileSync(outputFile, "utf-8");
    expect(content).toContain('"$schema": "https://getmcp.es/registry-entry.schema.json"');
    expect(content).toContain('"id": "my-server"');
    expect(content).toContain('"name": "My Server"');
    expect(content).toContain('"command": "npx"');
    expect(content).toContain("API_KEY");
  });

  it("scaffolds a remote server entry", async () => {
    const p = await import("@clack/prompts");

    const textMock = p.text as ReturnType<typeof vi.fn>;
    textMock
      .mockResolvedValueOnce("remote-server") // id
      .mockResolvedValueOnce("Remote Server") // name
      .mockResolvedValueOnce("A remote server") // description
      .mockResolvedValueOnce("https://example.com/mcp") // url
      .mockResolvedValueOnce("") // repository
      .mockResolvedValueOnce("") // homepage
      .mockResolvedValueOnce(""); // author

    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("http"); // transport

    (p.multiselect as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await initCommand();

    const outputFile = path.join(tmpDir, "remote-server.json");
    expect(fs.existsSync(outputFile)).toBe(true);

    const content = fs.readFileSync(outputFile, "utf-8");
    expect(content).toContain('"id": "remote-server"');
    expect(content).toContain('"url": "https://example.com/mcp"');
    expect(content).toContain('"transport": "http"');
  });

  it("warns and prompts overwrite when file already exists", async () => {
    const p = await import("@clack/prompts");

    const textMock = p.text as ReturnType<typeof vi.fn>;
    textMock
      .mockResolvedValueOnce("existing-server") // id
      .mockResolvedValueOnce("Existing Server") // name
      .mockResolvedValueOnce("Already exists") // description
      .mockResolvedValueOnce("https://example.com/mcp") // url
      .mockResolvedValueOnce("") // repository
      .mockResolvedValueOnce("") // homepage
      .mockResolvedValueOnce(""); // author

    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("http");
    (p.multiselect as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (p.confirm as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(true) // overwrite
      .mockResolvedValueOnce(true); // create file

    fs.writeFileSync(path.join(tmpDir, "existing-server.json"), "old content");

    await initCommand();

    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("File already exists"));

    // File should be overwritten
    const content = fs.readFileSync(path.join(tmpDir, "existing-server.json"), "utf-8");
    expect(content).toContain('"id": "existing-server"');
  });

  it("respects --output option", async () => {
    const p = await import("@clack/prompts");

    const textMock = p.text as ReturnType<typeof vi.fn>;
    textMock
      .mockResolvedValueOnce("custom-server") // id
      .mockResolvedValueOnce("Custom Server") // name
      .mockResolvedValueOnce("A custom server") // description
      .mockResolvedValueOnce("https://example.com/mcp") // url
      .mockResolvedValueOnce("") // repository
      .mockResolvedValueOnce("") // homepage
      .mockResolvedValueOnce(""); // author

    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("http");
    (p.multiselect as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const customDir = path.join(tmpDir, "custom-dir");

    await initCommand({ output: customDir });

    const outputFile = path.join(customDir, "custom-server.json");
    expect(fs.existsSync(outputFile)).toBe(true);
    expect(fs.existsSync(customDir)).toBe(true);

    const content = fs.readFileSync(outputFile, "utf-8");
    expect(content).toContain('"id": "custom-server"');
  });

  it("validates repository and homepage URLs", async () => {
    const p = await import("@clack/prompts");

    const textMock = p.text as ReturnType<typeof vi.fn>;
    textMock
      .mockResolvedValueOnce("val-server") // id
      .mockResolvedValueOnce("Val Server") // name
      .mockResolvedValueOnce("Validation test") // description
      .mockResolvedValueOnce("https://example.com/mcp") // url
      .mockResolvedValueOnce("https://github.com/user/repo") // repository
      .mockResolvedValueOnce("https://example.com") // homepage
      .mockResolvedValueOnce(""); // author

    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("http");
    (p.multiselect as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await initCommand();

    // Find the repository prompt call (5th text call, index 4) and homepage (6th, index 5)
    const repoCfg = textMock.mock.calls[4][0];
    const homepageCfg = textMock.mock.calls[5][0];

    // Invalid URLs should be rejected
    expect(repoCfg.validate("not-a-url")).toBe("Must be a valid URL");
    expect(homepageCfg.validate("not-a-url")).toBe("Must be a valid URL");

    // Valid URLs should pass
    expect(repoCfg.validate("https://github.com/user/repo")).toBeUndefined();
    expect(homepageCfg.validate("https://example.com")).toBeUndefined();

    // Empty values should pass (optional fields)
    expect(repoCfg.validate("")).toBeUndefined();
    expect(homepageCfg.validate("")).toBeUndefined();
  });

  it("includes homepage in output when provided", async () => {
    const p = await import("@clack/prompts");

    const textMock = p.text as ReturnType<typeof vi.fn>;
    textMock
      .mockResolvedValueOnce("hp-server") // id
      .mockResolvedValueOnce("HP Server") // name
      .mockResolvedValueOnce("Homepage test") // description
      .mockResolvedValueOnce("https://example.com/mcp") // url
      .mockResolvedValueOnce("") // repository
      .mockResolvedValueOnce("https://my-homepage.com") // homepage
      .mockResolvedValueOnce(""); // author

    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce("http");
    (p.multiselect as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await initCommand();

    const outputFile = path.join(tmpDir, "hp-server.json");
    expect(fs.existsSync(outputFile)).toBe(true);

    const content = fs.readFileSync(outputFile, "utf-8");
    expect(content).toContain('"homepage": "https://my-homepage.com"');
  });
});
