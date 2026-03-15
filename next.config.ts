import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip static generation for error pages that fail due to base-ui SSR issue
  experimental: {
    staticGenerationRetryCount: 0,
  },
};

export default nextConfig;
