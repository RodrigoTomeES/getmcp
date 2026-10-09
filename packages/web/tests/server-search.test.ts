import { describe, expect, it } from "vitest";
import type { ServerCardData } from "../src/lib/server-detail";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  isDefaultState,
  sortServers,
  type SearchState,
} from "../src/lib/server-search";

function card(name: string, extra: Partial<ServerCardData> = {}): ServerCardData {
  return {
    id: `io.example/${name}`,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    description: "",
    isRemote: false,
    envCount: 0,
    ...extra,
  };
}

const names = (list: ServerCardData[]) => list.map((s) => s.name);

describe("sortServers", () => {
  it("sorts alphabetically ignoring case", () => {
    const result = sortServers([card("Beta"), card("alpha"), card("Gamma")], "alphabetical");
    expect(names(result)).toEqual(["alpha", "Beta", "Gamma"]);
  });

  it("sorts numbers inside names numerically", () => {
    const result = sortServers([card("Server 10"), card("Server 2")], "alphabetical");
    expect(names(result)).toEqual(["Server 2", "Server 10"]);
  });

  it("keeps input order for ties", () => {
    const a = card("Same", { id: "a" });
    const b = card("same", { id: "b" });
    expect(sortServers([a, b], "alphabetical").map((s) => s.id)).toEqual(["a", "b"]);
    expect(sortServers([b, a], "alphabetical").map((s) => s.id)).toEqual(["b", "a"]);
    const c = card("C", { stars: 5 });
    const d = card("D", { stars: 5 });
    expect(names(sortServers([d, c], "stars"))).toEqual(["D", "C"]);
  });

  it("sorts stars descending with missing values last", () => {
    const result = sortServers(
      [card("A"), card("B", { stars: 3 }), card("C", { stars: 10 }), card("D", { stars: 0 })],
      "stars",
    );
    expect(names(result)).toEqual(["C", "B", "D", "A"]);
  });

  it("sorts downloads descending with missing values last", () => {
    const result = sortServers(
      [card("A", { downloads: 1 }), card("B"), card("C", { downloads: 100 })],
      "downloads",
    );
    expect(names(result)).toEqual(["C", "A", "B"]);
  });

  it("does not mutate the input array", () => {
    const input = [card("b"), card("a")];
    const copy = [...input];
    const result = sortServers(input, "alphabetical");
    expect(input).toEqual(copy);
    expect(result).not.toBe(input);
  });
});

describe("isDefaultState", () => {
  const base: SearchState = {
    q: "",
    categories: [],
    runtimes: [],
    transports: [],
    official: false,
    sort: DEFAULT_SORT,
    pageSize: DEFAULT_PAGE_SIZE,
    page: 1,
  };

  it("is true for the unfiltered first page", () => {
    expect(isDefaultState(base)).toBe(true);
  });

  it("ignores a whitespace-only query", () => {
    expect(isDefaultState({ ...base, q: "   " })).toBe(true);
  });

  it.each<[string, Partial<SearchState>]>([
    ["a query", { q: "github" }],
    ["a category", { categories: ["ai"] }],
    ["a runtime", { runtimes: ["node"] }],
    ["a transport", { transports: ["remote"] }],
    ["official only", { official: true }],
    ["another sort", { sort: "alphabetical" }],
    ["another page size", { pageSize: 48 }],
    ["a later page", { page: 2 }],
  ])("is false with %s", (_, change) => {
    expect(isDefaultState({ ...base, ...change })).toBe(false);
  });
});
