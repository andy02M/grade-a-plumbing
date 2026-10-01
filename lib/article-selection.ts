import type { Article } from "./articles";

// Melbourne is the editorial host, not evidence that a suburb guide applies
// to every location. An article naming other targets remains location-specific.
export function selectLocationArticles(catalog: Article[], locationSlug: string, limit = 3): Article[] {
  if (!Number.isInteger(limit) || limit < 1) return [];
  const latest = catalog.filter(article => article.status === "published")
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate) || a.slug.localeCompare(b.slug));
  const eligible = locationSlug === "melbourne" ? latest : [
    ...latest.filter(article => article.locationSlugs?.includes(locationSlug)),
    ...latest.filter(article => !article.locationSlugs?.some(slug => slug !== "melbourne")),
  ];
  const seen = new Set<string>();
  return eligible.filter(article => {
    if (seen.has(article.slug)) return false;
    seen.add(article.slug);
    return true;
  }).slice(0, limit);
}

export function isSuburbArticle(article: Article, locationSlug: string): boolean {
  return locationSlug !== "melbourne" && Boolean(article.locationSlugs?.includes(locationSlug));
}
