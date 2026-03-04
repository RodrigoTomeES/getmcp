import { describe, it, expect } from "vitest";
import { generateSlug } from "../src/id-mapping.js";

describe("generateSlug", () => {
  it("extracts last segment after /", () => {
    expect(generateSlug("io.github.getsentry/sentry-mcp")).toBe("sentry");
  });

  it("strips -mcp-server suffix", () => {
    expect(generateSlug("io.github.test/example-mcp-server")).toBe("example");
  });

  it("strips -mcp suffix", () => {
    expect(generateSlug("io.github.test/example-mcp")).toBe("example");
  });

  it("strips -server suffix", () => {
    expect(generateSlug("io.github.test/example-server")).toBe("example");
  });

  it("keeps short names without suffixes", () => {
    expect(generateSlug("io.github.test/redis")).toBe("redis");
  });

  it("sanitizes non-alphanumeric characters", () => {
    expect(generateSlug("io.github.test/My_Server.v2")).toBe("my-server-v2");
  });

  it("handles single segment names", () => {
    expect(generateSlug("simple-server")).toBe("simple");
  });

  it("does not strip suffix if it would result in empty string", () => {
    expect(generateSlug("io.github.test/mcp")).toBe("mcp");
  });
});
