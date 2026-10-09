import { describe, it, expect } from "vitest";
import { formatDate, formatRelativeTime, toSentence } from "@/lib/format";

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

describe("formatDate", () => {
  it("formats a valid date as a medium UTC date", () => {
    expect(formatDate("2026-10-03T23:30:00Z")).toBe("Oct 3, 2026");
  });

  it("returns null for an invalid date", () => {
    expect(formatDate("not a date")).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it("formats minutes, hours and days", () => {
    expect(formatRelativeTime(ago(5 * MINUTE), now)).toBe("5m ago");
    expect(formatRelativeTime(ago(3 * HOUR + 59 * MINUTE), now)).toBe("3h ago");
    expect(formatRelativeTime(ago(3 * DAY), now)).toBe("3d ago");
  });

  it("formats months (30 days) and years (365 days)", () => {
    expect(formatRelativeTime(ago(150 * DAY), now)).toBe("5mo ago");
    expect(formatRelativeTime(ago(362 * DAY), now)).toBe("12mo ago");
    expect(formatRelativeTime(ago(2 * 365 * DAY), now)).toBe("2y ago");
  });

  it("returns null under a minute old", () => {
    expect(formatRelativeTime(ago(59_000), now)).toBeNull();
  });

  it("returns null for a future date", () => {
    expect(formatRelativeTime(ago(-3 * HOUR), now)).toBeNull();
  });

  it("returns null for an invalid date", () => {
    expect(formatRelativeTime("not a date", now)).toBeNull();
  });
});
