/**
 * Serialise structured data for an inline `<script type="application/ld+json">`.
 * Escapes every `<` as its JSON unicode escape so third-party text (registry
 * descriptions) cannot close the `<script>` or open an HTML comment. The output
 * still parses to the same JSON.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
