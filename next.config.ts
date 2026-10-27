import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { qualities: [60, 65, 75], imageSizes:[16,32,48,64,96,128,192,256,320,384] },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  turbopack: { root: process.cwd() },
  async headers() {
    return [{source:"/assets/performance/:path*",headers:[{key:"Cache-Control",value:"public, max-age=31536000, immutable"}]}];
  },
  async redirects() {
    return [
      // Root aliases already declare Melbourne canonical. Redirect only their
      // duplicate homepage; never move suburb hosts, APIs or other working URLs.
      { source: '/', has: [{type:'host',value:'^(?:www\\.)?gradeaplumbing\\.store$'}], destination:'https://melbourne.gradeaplumbing.store/', permanent:true },
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
