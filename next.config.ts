import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["e71307a11404.ngrok-free.app", "localhost:3000", "*"],
    },
    // serverComponentsExternalPackages: [
    //   "puppeteer-extra",
    //   "puppeteer-extra-plugin-stealth",
    // ],
  },
};

export default nextConfig;
