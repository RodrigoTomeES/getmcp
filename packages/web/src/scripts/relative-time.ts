/**
 * Rewrites `<time data-relative-time datetime="…">` elements, rendered with an
 * absolute date at build time, as relative text ("3d ago"). Without JS, or for
 * dates under a minute old, the absolute date stays.
 *
 * Import it from the components that render those elements, not globally.
 */
import { formatRelativeTime } from "@/lib/format";

for (const el of document.querySelectorAll<HTMLTimeElement>("time[data-relative-time]")) {
  const text = formatRelativeTime(el.dateTime);
  if (text) el.textContent = text;
}
