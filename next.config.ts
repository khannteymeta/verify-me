import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg and ioredis use Node APIs; keep them out of the bundle.
  serverExternalPackages: ["pg", "ioredis"],
};

export default nextConfig;
