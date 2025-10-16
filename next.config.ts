import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},   // <- object, not true
  },
  eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true }, // leave commented unless you need it
};

export default nextConfig;
