import { describe, it, expect } from "vitest";
import { detectConfigFormat } from "../src/format.js";

describe("detectConfigFormat", () => {
  it("detects .json as json", () => {
    expect(detectConfigFormat("config.json")).toBe("json");
    expect(detectConfigFormat("/path/to/claude_desktop_config.json")).toBe("json");
  });

  it("detects .jsonc as jsonc", () => {
    expect(detectConfigFormat("opencode.jsonc")).toBe("jsonc");
    expect(detectConfigFormat("/home/user/.config/opencode.jsonc")).toBe("jsonc");
  });

  it("detects .yaml as yaml", () => {
    expect(detectConfigFormat("config.yaml")).toBe("yaml");
    expect(detectConfigFormat("/home/user/.config/goose/config.yaml")).toBe("yaml");
  });

  it("detects .yml as yaml", () => {
    expect(detectConfigFormat("config.yml")).toBe("yaml");
    expect(detectConfigFormat("/path/to/settings.yml")).toBe("yaml");
  });

  it("detects .toml as toml", () => {
    expect(detectConfigFormat("config.toml")).toBe("toml");
    expect(detectConfigFormat("/home/user/.codex/config.toml")).toBe("toml");
  });

  it("defaults to json for unknown extensions", () => {
    expect(detectConfigFormat("config.xml")).toBe("json");
    expect(detectConfigFormat("config.ini")).toBe("json");
    expect(detectConfigFormat("config.txt")).toBe("json");
  });

  it("defaults to json for files with no extension", () => {
    expect(detectConfigFormat("config")).toBe("json");
    expect(detectConfigFormat("/path/to/config")).toBe("json");
  });

  it("is case-insensitive for extensions", () => {
    expect(detectConfigFormat("config.JSON")).toBe("json");
    expect(detectConfigFormat("config.YAML")).toBe("yaml");
    expect(detectConfigFormat("config.TOML")).toBe("toml");
    expect(detectConfigFormat("config.YML")).toBe("yaml");
    expect(detectConfigFormat("config.JSONC")).toBe("jsonc");
  });
});
