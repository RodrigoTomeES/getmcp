import { describe, it, expect } from "vitest";
import { toSentence } from "@/lib/format";

describe("toSentence", () => {
  it("adds a period when there is no final punctuation", () => {
    expect(toSentence("Connect AI assistants to GitHub")).toBe("Connect AI assistants to GitHub.");
  });

  it("keeps text that already ends with a period", () => {
    expect(toSentence("Sign in once.")).toBe("Sign in once.");
  });

  it("keeps other sentence-ending punctuation", () => {
    expect(toSentence("Fast!")).toBe("Fast!");
    expect(toSentence("Why not?")).toBe("Why not?");
    expect(toSentence("No API keys, USDC on…")).toBe("No API keys, USDC on…");
  });

  it("keeps punctuation followed by a closing quote or bracket", () => {
    expect(toSentence('He said "fast."')).toBe('He said "fast."');
    expect(toSentence("Beta release (experimental.)")).toBe("Beta release (experimental.)");
  });

  it("replaces a trailing comma, colon or semicolon with a period", () => {
    expect(toSentence("Tools:")).toBe("Tools.");
    expect(toSentence("Search, fetch;")).toBe("Search, fetch.");
  });

  it("trims surrounding whitespace", () => {
    expect(toSentence("  Sign in once.  ")).toBe("Sign in once.");
    expect(toSentence("Sign in once  ")).toBe("Sign in once.");
  });
});
