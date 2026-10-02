import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      // Consolidate the exact duplicate paths found in Search Console.
      // Keep API routes and all existing canonical page URLs unchanged.
      // Next matches an optional final slash; exclude it to avoid self-redirects.
      { source: "/:page(contact(?!/))", destination: "/contact/", permanent: true },
      { source: "/:page(service-areas(?!/))", destination: "/service-areas/", permanent: true },
      { source: "/blocked-drains-melbourne", destination: "/blocked-drains/", permanent: true },
      { source: "/hot-water-repairs-melbourne", destination: "/hot-water/", permanent: true },
      { source: "/emergency-plumbing-melbourne", destination: "/emergency-plumber/", permanent: true },
      { source: "/commercial-plumbing-melbourne", destination: "/commercial-plumbing/", permanent: true },
    ];
  },
};
export default nextConfig;
