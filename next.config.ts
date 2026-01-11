import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*",
        "localhost:3000",
        "https://cf-tracker-nine.vercel.app/",
        "https://47b008753430.ngrok-free.app/",
      ],
    },
  },
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
