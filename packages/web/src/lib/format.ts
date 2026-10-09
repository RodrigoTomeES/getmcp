export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${parseFloat((n / 1_000_000).toFixed(1))}M`;
  if (n >= 1_000) return `${parseFloat((n / 1_000).toFixed(1))}k`;
  return String(n);
}

/**
 * Ensure third-party text ends as a sentence: trims it, drops a trailing `,` `:` `;`
 * and adds a period unless it already ends with `.` `!` `?` or `…` (optionally
 * followed by a closing quote or bracket).
 */
export function toSentence(text: string): string {
  const trimmed = text.trim().replace(/[,:;]+$/, "");
  return /[.!?…]["')\]]*$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/** Absolute date such as "Oct 3, 2026" (UTC), or null when `isoDate` is not a valid date. */
export function formatDate(isoDate: string): string | null {
  const time = new Date(isoDate).getTime();
  return Number.isNaN(time) ? null : dateFormat.format(time);
}

const relativeFormat = new Intl.RelativeTimeFormat("en", { style: "narrow" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
];

/**
 * Past time relative to `now`, such as "3d ago", "5mo ago" or "2y ago". Returns
 * null for an invalid date and for anything under a minute old, including
 * future dates (clock skew), so callers keep showing the absolute date.
 */
export function formatRelativeTime(isoDate: string, now = Date.now()): string | null {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  const elapsed = Math.max(0, now - then);
  for (const [unit, size] of RELATIVE_UNITS) {
    if (elapsed >= size) return relativeFormat.format(-Math.floor(elapsed / size), unit);
  }
  return null;
}
