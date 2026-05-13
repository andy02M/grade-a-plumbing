import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const routes = [
  "/",
  "/emergency-plumbing-melbourne",
  "/blocked-drains-melbourne",
  "/hot-water-repairs-melbourne",
  "/commercial-plumbing-melbourne",
  "/service-areas",
  "/contact"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${site.baseUrl}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8
  }));
}
