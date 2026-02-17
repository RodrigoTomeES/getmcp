import { describe, it, expect } from "vitest";
import { isStdioConfig, isRemoteConfig, inferTransport } from "../src/utils.js";
import type { LooseServerConfigType } from "../src/types.js";

const stdioConfig: LooseServerConfigType = {
  command: "npx",
  args: ["-y", "my-server"],
  env: {},
  transport: "stdio",
};

const remoteHttpConfig: LooseServerConfigType = {
  url: "https://mcp.example.com/mcp",
  headers: {},
};

const remoteSseConfig: LooseServerConfigType = {
  url: "https://mcp.example.com/sse",
  transport: "sse",
  headers: {},
};

describe("isStdioConfig", () => {
  it("returns true for stdio configs", () => {
    expect(isStdioConfig(stdioConfig)).toBe(true);
  });

  it("returns false for remote configs", () => {
    expect(isStdioConfig(remoteHttpConfig)).toBe(false);
    expect(isStdioConfig(remoteSseConfig)).toBe(false);
  });
});

describe("isRemoteConfig", () => {
  it("returns true for remote configs", () => {
    expect(isRemoteConfig(remoteHttpConfig)).toBe(true);
    expect(isRemoteConfig(remoteSseConfig)).toBe(true);
  });

  it("returns false for stdio configs", () => {
    expect(isRemoteConfig(stdioConfig)).toBe(false);
  });
});

describe("inferTransport", () => {
  it("returns 'stdio' for stdio configs", () => {
    expect(inferTransport(stdioConfig)).toBe("stdio");
  });

  it("returns 'http' for remote HTTP configs", () => {
    expect(inferTransport(remoteHttpConfig)).toBe("http");
  });

  it("returns 'sse' when transport is explicit", () => {
    expect(inferTransport(remoteSseConfig)).toBe("sse");
  });

  it("infers 'sse' from URL path /sse", () => {
    const config: LooseServerConfigType = {
      url: "https://mcp.example.com/sse",
      headers: {},
    };
    expect(inferTransport(config)).toBe("sse");
  });

  it("infers 'sse' from URL path /sse/", () => {
    const config: LooseServerConfigType = {
      url: "https://mcp.example.com/sse/",
      headers: {},
    };
    expect(inferTransport(config)).toBe("sse");
  });

  it("infers 'http' for non-sse URLs", () => {
    const config: LooseServerConfigType = {
      url: "https://mcp.example.com/mcp",
      headers: {},
    };
    expect(inferTransport(config)).toBe("http");
  });

  it("uses explicit transport over URL inference", () => {
    const config: LooseServerConfigType = {
      url: "https://mcp.example.com/sse",
      transport: "streamable-http",
      headers: {},
    };
    expect(inferTransport(config)).toBe("streamable-http");
  });
});
