import { describe, expect, it } from "vitest";
import type { ServerCardData } from "../src/lib/server-detail";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  isDefaultState,
  readSearchState,
  sortServers,
  toSearchString,
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

describe("readSearchState", () => {
  const categories = ["ai", "database"];
  const read = (search: string) => readSearchState(search, categories);

  it("returns the defaults for an empty query string", () => {
    expect(isDefaultState(read(""))).toBe(true);
  });

  it("reads every param", () => {
    expect(
      read(
        "?q=git+hub&category=ai,database&runtime=node&transport=remote&official=true&sort=downloads&per_page=48&page=3",
      ),
    ).toEqual({
      q: "git hub",
      categories: ["ai", "database"],
      runtimes: ["node"],
      transports: ["remote"],
      official: true,
      sort: "downloads",
      pageSize: 48,
      page: 3,
    });
  });

  it.each(["abc", "0", "-2", "1.5", "2abc", ""])("falls back to page 1 for page=%s", (page) => {
    expect(read(`page=${page}`).page).toBe(1);
  });

  it("falls back to the default sort and page size for unknown values", () => {
    const state = read("sort=bogus&per_page=5");
    expect(state.sort).toBe(DEFAULT_SORT);
    expect(state.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it("drops unknown categories, runtimes and transports", () => {
    const state = read("category=ai,bogus&runtime=bogus,python&transport=foo");
    expect(state.categories).toEqual(["ai"]);
    expect(state.runtimes).toEqual(["python"]);
    expect(state.transports).toEqual([]);
  });

  it("dedupes multi-value params", () => {
    const state = read("category=ai,ai&runtime=node,node&transport=stdio,stdio");
    expect(state.categories).toEqual(["ai"]);
    expect(state.runtimes).toEqual(["node"]);
    expect(state.transports).toEqual(["stdio"]);
  });

  it("only accepts official=true", () => {
    expect(read("official=1").official).toBe(false);
  });
});

describe("toSearchString", () => {
  const categories = ["ai", "database"];
  const canonical = (search: string) => toSearchString(readSearchState(search, categories), search);

  it.each([
    "",
    "q=github",
    "q=git+hub&category=ai,database&runtime=node&transport=remote&official=true&sort=downloads&per_page=48&page=3",
    "sort=downloads&page=2",
    "utm_source=x",
  ])("keeps the canonical %j unchanged", (search) => {
    expect(canonical(search)).toBe(search);
  });

  it("removes invalid params", () => {
    expect(canonical("page=abc&sort=bogus&runtime=bogus")).toBe("");
  });

  it("omits defaults and page 1", () => {
    expect(canonical("page=1&sort=stars&per_page=24&official=false")).toBe("");
  });

  it("keeps unknown params after the search state", () => {
    expect(canonical("utm_source=x&page=2&q=github")).toBe("q=github&page=2&utm_source=x");
  });

  it("writes the given page", () => {
    const state = readSearchState("q=github&page=50", categories);
    expect(toSearchString({ ...state, page: 4 }, "q=github&page=50")).toBe("q=github&page=4");
  });
});
