import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: process.env.NODE_ENV !== "production", // سرعت بیشتر در build و runtime
  // productionBrowserSourceMaps: false, // حذف sourcemap در production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // حذف console در build
  },
  // @ts-expect-error: eslint option is supported at runtime but missing from types
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "production", // ⛔ حذف lint در build
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === "production", // ⛔ نادیده گرفتن خطاهای TS در build
  },
};

export default nextConfig;
