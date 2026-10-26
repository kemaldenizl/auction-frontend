import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Product images come from whatever URL the catalog service stored, so the
    // host is not known up front. Narrow this to the real image hosts before
    // deploying anywhere public.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    // The seeded catalog points at placehold.co, which answers with SVG. SVG
    // can carry scripts, so it is served sandboxed and with scripting blocked,
    // as the Next.js image docs prescribe.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
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
