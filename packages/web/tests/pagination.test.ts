import { describe, expect, it } from "vitest";
import { CATEGORY_PAGE_SIZE, categoryPageUrl, getPageNumbers } from "@/lib/pagination";

describe("getPageNumbers", () => {
  it("lists every page when there are 7 or fewer", () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
    expect(getPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("shows the first pages without a leading ellipsis near the start", () => {
    expect(getPageNumbers(1, 58)).toEqual([1, 2, "ellipsis", 58]);
    expect(getPageNumbers(3, 58)).toEqual([1, 2, 3, 4, "ellipsis", 58]);
  });

  it("surrounds the current page with ellipses in the middle", () => {
    expect(getPageNumbers(20, 58)).toEqual([1, "ellipsis", 19, 20, 21, "ellipsis", 58]);
  });

  it("shows the last pages without a trailing ellipsis near the end", () => {
    expect(getPageNumbers(56, 58)).toEqual([1, "ellipsis", 55, 56, 57, 58]);
    expect(getPageNumbers(58, 58)).toEqual([1, "ellipsis", 57, 58]);
  });
});

describe("categoryPageUrl", () => {
  it("keeps page 1 at the category root", () => {
    expect(categoryPageUrl("ai", 1)).toBe("/category/ai");
  });

  it("appends the page number for later pages, without a trailing slash", () => {
    expect(categoryPageUrl("ai", 3)).toBe("/category/ai/3");
  });

  it("uses 48 servers per page", () => {
    expect(CATEGORY_PAGE_SIZE).toBe(48);
  });
});
