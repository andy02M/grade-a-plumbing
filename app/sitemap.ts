import type { MetadataRoute } from "next";
import { getRequestLocation } from "@/lib/location-request";
import { locationHasService, services, serviceUrl } from "@/lib/seo-services";
import { publishedArticles } from "@/lib/articles";

const locationContentUpdated = new Date("2026-09-22T00:00:00+10:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const location = await getRequestLocation();
  const isEditorialHost = location.slug === "melbourne";
  return [
    { url: `${location.website}/`, lastModified: locationContentUpdated, changeFrequency: "weekly", priority: 1 },
    ...(locationHasService(location) ? services : []).map((service) => ({ url: `${location.website}${serviceUrl(service.slug)}`, lastModified: locationContentUpdated, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${location.website}/service-areas/`, lastModified: locationContentUpdated, changeFrequency: "monthly", priority: 0.8 },
    ...(isEditorialHost ? [
      { url: `${location.website}/blog/`, lastModified: locationContentUpdated, changeFrequency: "weekly" as const, priority: 0.7 },
      ...publishedArticles.map((article) => ({ url: `${location.website}/blog/${article.slug}/`, lastModified: new Date(article.updatedDate ?? article.publishedDate), changeFrequency: "monthly" as const, priority: 0.7 })),
    ] : []),
    { url: `${location.website}/contact/`, lastModified: locationContentUpdated, changeFrequency: "monthly", priority: 0.8 },
  ];
}
