import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDockerMetrics, fetchMetricsForEntry } from "../src/fetch-metrics.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function okJson(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// fetchDockerMetrics — skip filter
// ---------------------------------------------------------------------------

describe("fetchDockerMetrics — skip filter", () => {
  it("skips GHCR images (returns null without HTTP call)", async () => {
    const result = await fetchDockerMetrics("ghcr.io/owner/image");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips GAR images with path segments", async () => {
    const result = await fetchDockerMetrics("us-central1-docker.pkg.dev/project/repo/image");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips quay.io images", async () => {
    const result = await fetchDockerMetrics("quay.io/org/image");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips ECR images", async () => {
    const result = await fetchDockerMetrics("123456789.dkr.ecr.us-east-1.amazonaws.com/repo");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows bare Docker Hub identifiers (namespace/repo)", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 100 }));
    const result = await fetchDockerMetrics("myns/myrepo");
    expect(result).toEqual({ pulls: 100, imageSize: undefined });
  });

  it("allows docker.io/ prefixed identifiers", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 200, full_size: 5000 }));
    const result = await fetchDockerMetrics("docker.io/myns/myrepo");
    expect(result).toEqual({ pulls: 200, imageSize: 5000 });
  });
});

// ---------------------------------------------------------------------------
// fetchDockerMetrics — tag stripping
// ---------------------------------------------------------------------------

describe("fetchDockerMetrics — tag stripping", () => {
  it("strips version tag before lookup", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 50 }));
    await fetchDockerMetrics("myns/myrepo:1.2.3");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hub.docker.com/v2/repositories/myns/myrepo/",
      undefined,
    );
  });

  it("handles identifier without tag", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 50 }));
    await fetchDockerMetrics("myns/myrepo");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hub.docker.com/v2/repositories/myns/myrepo/",
      undefined,
    );
  });
});

// ---------------------------------------------------------------------------
// fetchDockerMetrics — URL construction
// ---------------------------------------------------------------------------

describe("fetchDockerMetrics — URL construction", () => {
  it("uses library/ namespace for bare image names", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 999 }));
    await fetchDockerMetrics("nginx");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hub.docker.com/v2/repositories/library/nginx/",
      undefined,
    );
  });

  it("uses explicit namespace for namespace/repo", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 42 }));
    await fetchDockerMetrics("mynamespace/myimage");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hub.docker.com/v2/repositories/mynamespace/myimage/",
      undefined,
    );
  });

  it("strips docker.io/ prefix before constructing URL", async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ pull_count: 10 }));
    await fetchDockerMetrics("docker.io/owner/repo");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hub.docker.com/v2/repositories/owner/repo/",
      undefined,
    );
  });

  it("returns null on API failure", async () => {
    fetchSpy.mockResolvedValueOnce(notFound());
    const result = await fetchDockerMetrics("nonexistent/image");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchMetricsForEntry — package iteration
// ---------------------------------------------------------------------------

describe("fetchMetricsForEntry — package iteration", () => {
  it("finds OCI package at index 1", async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes("hub.docker.com")) {
        return Promise.resolve(okJson({ pull_count: 300 }));
      }
      if (url.includes("api.npmjs.org")) {
        return Promise.resolve(okJson({ downloads: 1000 }));
      }
      if (url.includes("registry.npmjs.org")) {
        return Promise.resolve(okJson({ version: "1.0.0" }));
      }
      return Promise.resolve(notFound());
    });

    const result = await fetchMetricsForEntry(undefined, [
      { registryType: "npm", identifier: "some-pkg" },
      { registryType: "oci", identifier: "owner/image" },
    ]);

    expect(result?.npm).toBeDefined();
    expect(result?.docker).toEqual({ pulls: 300, imageSize: undefined });
  });

  it("fetches only first package of each type", async () => {
    let dockerCalls = 0;
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes("hub.docker.com")) {
        dockerCalls++;
        return Promise.resolve(okJson({ pull_count: 100 }));
      }
      return Promise.resolve(notFound());
    });

    await fetchMetricsForEntry(undefined, [
      { registryType: "oci", identifier: "ns/first" },
      { registryType: "oci", identifier: "ns/second" },
    ]);

    expect(dockerCalls).toBe(1);
  });

  it("handles empty packages array", async () => {
    const result = await fetchMetricsForEntry(undefined, []);
    expect(result).toBeNull();
  });

  it("returns null when all package fetches fail", async () => {
    fetchSpy.mockResolvedValue(notFound());
    const result = await fetchMetricsForEntry(undefined, [
      { registryType: "oci", identifier: "bad/image" },
    ]);
    expect(result).toBeNull();
  });
});
