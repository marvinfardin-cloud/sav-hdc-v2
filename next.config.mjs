import { join } from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => Date.now().toString(),
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "web-push"],
    outputFileTracingIncludes: {
      "**/*": [join("./src/generated/prisma/**")],
    },
  },
};

export default nextConfig;
