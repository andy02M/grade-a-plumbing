import type { MetadataRoute } from "next";
import { getRequestLocation } from "@/lib/location-request";
import { site } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const location = await getRequestLocation();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/", "/seo-dashboard/"] },
    sitemap: [`${location.website}/sitemap.xml`, `${site.baseUrl}/sitemap-index.xml`],
    host: location.website,
  };
}
