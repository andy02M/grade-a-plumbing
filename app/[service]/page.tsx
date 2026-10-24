import { serviceSeoFor } from "@/components/manus/seoContent";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ManusApp from "@/components/manus/App";
import { getRouteMeta } from "@/components/manus/routeMeta";
import {
  normalizePageRoute,
  isMarketingRoute,
} from "@/components/manus/routes";
import { getRequestLocation } from "@/lib/location-request";
import { locationHasService, serviceBySlug } from "@/lib/seo-services";
import { publishedArticles } from "@/lib/articles";
import { selectLocationArticles } from "@/lib/article-selection";
import { site } from "@/lib/site";
import { JsonLd } from "@/lib/seo";
import { pageMetadata, pageBreadcrumbs, serviceIdentity } from "@/lib/page-seo";
const legacy: Record<string, string> = {
  "/emergency-plumbing/": "/emergency-plumber/",
  "/hot-water-systems/": "/hot-water/",
  "/burst-pipe-repairs/": "/burst-pipe-repair/",
  "/contact-us/": "/contact/",
  "/about-us/": "/about/",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}): Promise<Metadata> {
  const { service } = await params;
  const path = "/" + service + "/";
  if (!isMarketingRoute(path)) return {};
  const l = await getRequestLocation();
  const meta = getRouteMeta(normalizePageRoute(path));
  const identity = serviceIdentity(service, l.location);
  const canonical = l.website + (legacy[path] ?? path);
  const title = identity?.title ?? (service === "services" ? `Plumbing Services ${l.location} | Grade A Plumbing` : meta.title),
    description = identity?.description ?? (service === "services" ? `Explore plumbing assessment and repair services in ${l.location}. Compare service information and contact Grade A Plumbing to confirm availability.` : meta.description);
  return {
    ...pageMetadata(title, description, canonical),
    robots:
      !locationHasService(l) &&
      !["services", "about", "our-work", "reviews"].includes(service)
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const path = "/" + service + "/";
  if (legacy[path]) permanentRedirect(legacy[path]);
  if (!isMarketingRoute(path)) notFound();
  const l = await getRequestLocation();
  const meta = getRouteMeta(normalizePageRoute(path));
  const seo = serviceSeoFor(normalizePageRoute(path).replaceAll("/", ""));
  const identity = serviceIdentity(service, l.location);
  const related = selectLocationArticles(
    publishedArticles.filter((article) =>
      article.relatedServices.includes(service),
    ),
    l.slug,
  );
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: identity?.title ?? meta.title,
          url: l.website + path,
        }}
      />
      <JsonLd data={pageBreadcrumbs(l.website, meta.breadcrumbs.map((crumb, index) => ({name: crumb.label, path: index === meta.breadcrumbs.length - 1 ? path : crumb.href ?? "/"})))} />
      {seo && (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Service",
              name: identity?.label ?? meta.title,
              description: identity?.description ?? meta.description,
              serviceType: identity?.label,
              url: l.website + path,
              areaServed: { "@type": "Place", name: `${l.location}, ${l.state}, Australia` },
              provider: { "@type": "Plumber", "@id": l.website + "/#business", name: l.name, url: l.website, telephone: l.phone ?? site.phone },
            }}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: seo.faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            }}
          />
        </>
      )}
      <ManusApp initialPath={path} embedded locationName={l.location} />
      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>Related plumbing advice</h2>
            {related.map((a) => (
              <p key={a.slug}>
                <a href={site.baseUrl + "/blog/" + a.slug + "/"}>{a.title}</a>
              </p>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
