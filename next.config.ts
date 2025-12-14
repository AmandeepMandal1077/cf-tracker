import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["e71307a11404.ngrok-free.app", "localhost:3000", "*"],
    },
  },
};

export default nextConfig;
