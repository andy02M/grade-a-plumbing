import { locations } from "@/lib/locations";

export const dynamic = "force-static";

export function GET() {
  const body = locations.map((location) => `<sitemap><loc>${location.website}/sitemap.xml</loc></sitemap>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
