import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CEREBRAS_API_KEY: process.env.NEXT_PUBLIC_CEREBRAS_API_KEY,
    NEXT_PUBLIC_CEREBRAS_API_URL: process.env.NEXT_PUBLIC_CEREBRAS_API_URL,
  },
  // Enable environment variables to be exposed to the client
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
