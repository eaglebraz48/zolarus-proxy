/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: true },

  // Let Netlify build finish even if ESLint finds issues
  eslint: { ignoreDuringBuilds: true },

  // (Optional) same idea for TypeScript build errors
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
