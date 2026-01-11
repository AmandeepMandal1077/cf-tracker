import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "cf-tracker.vercel.app"],
    },
  },
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
