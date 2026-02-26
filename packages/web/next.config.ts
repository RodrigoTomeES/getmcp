import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: [],
} satisfies NextConfig;

export default nextConfig;
