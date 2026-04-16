/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => Date.now().toString(),
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
