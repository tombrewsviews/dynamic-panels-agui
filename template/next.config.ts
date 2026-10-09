import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  // Hide the floating Next.js dev indicator; it overlaps the bottom chat inputs.
  devIndicators: false,
};

export default nextConfig;
