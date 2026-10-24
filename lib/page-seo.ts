import type { Metadata } from "next";
import { site } from "./site";
import { serviceBySlug } from "./seo-services";

// These are UI aliases, not new routes or redirects. Public canonical paths stay unchanged.
export const canonicalServiceSlug: Record<string, string> = {
  "emergency-plumbing": "emergency-plumber",
  "hot-water-systems": "hot-water",
  "burst-pipe-repairs": "burst-pipe-repair",
};
export const extraServiceLabels: Record<string, string> = {
  "toilet-repairs": "Toilet Repairs",
  "kitchen-plumbing": "Kitchen Plumbing",
  "bathroom-plumbing": "Bathroom Plumbing",
  "leak-detection": "Leak Detection",
};
export function serviceIdentity(slug: string, location: string) {
  const canonicalSlug = canonicalServiceSlug[slug] ?? slug;
  const definition = serviceBySlug.get(canonicalSlug);
  const label = definition?.label ?? extraServiceLabels[canonicalSlug];
  if (!label) return undefined;
  return {
    slug: canonicalSlug, label,
    title: definition?.title(location) ?? `${label} ${location} | Grade A Plumbing`,
    description: definition?.description(location) ?? `${label} in ${location}: discuss the symptoms, property access and assessment options with Grade A Plumbing. Call ${site.phone} or request a quote.`,
  };
}
export function pageMetadata(title: string, description: string, url: string): Metadata {
  const canonical = new URL(url).href;
  return {
    title, description, alternates: { canonical },
    openGraph: {title, description, url: canonical, siteName: site.name, locale: "en_AU", type: "website", images: [{url: `${site.baseUrl}/assets/grade-a/hero-plumber-under-sink.webp`, alt: "Grade A Plumbing"}]},
    twitter: {card: "summary_large_image", title, description, images: [`${site.baseUrl}/assets/grade-a/hero-plumber-under-sink.webp`]},
  };
}
export function pageBreadcrumbs(origin: string, items: {name: string; path: string}[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({"@type": "ListItem", position: i + 1, name: item.name, item: new URL(item.path, origin).href})),
  };
}
