import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to succeed even with ESLint warnings.
    // Lint errors are caught in CI (GitHub Actions) — no need to block deploy.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors are caught in CI. Allow deploy even with non-critical type issues.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
