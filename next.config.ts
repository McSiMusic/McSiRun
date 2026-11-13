import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isPages ? {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  } : {
    cacheComponents: true,
    partialPrefetching: true,
  }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
