import type { NextConfig } from "next";
const nextConfig:NextConfig={reactStrictMode:true,trailingSlash:true,skipTrailingSlashRedirect:true,turbopack:{root:process.cwd()},async redirects(){return[{source:"/blocked-drains-melbourne",destination:"/blocked-drains/",permanent:true},{source:"/hot-water-repairs-melbourne",destination:"/hot-water/",permanent:true},{source:"/emergency-plumbing-melbourne",destination:"/emergency-plumber/",permanent:true},{source:"/commercial-plumbing-melbourne",destination:"/commercial-plumbing/",permanent:true}]}};
export default nextConfig;
