/**
 * Security headers previously served by `next.config.ts`. A static build
 * cannot set response headers itself, so the hosting setup chosen in phase 2
 * (see `.agents/docs/ROADMAP.md`) must emit these, e.g. as a Cloudflare
 * `_headers` file or Transform Rules.
 *
 * Vercel Analytics hosts were replaced by Cloudflare Web Analytics.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com",
};
