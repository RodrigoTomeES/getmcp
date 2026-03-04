import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  },
];

const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: [],
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
} satisfies NextConfig;

export default nextConfig;
