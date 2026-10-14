import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { articleBySlug, publishedArticles } from "@/lib/articles";
import { getRequestLocation } from "@/lib/location-request";
import { JsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { getLocationBySlug } from "@/lib/locations";
import { serviceBySlug, serviceUrl } from "@/lib/seo-services";
import { QuoteForm } from "@/components/manus/components";
export function generateStaticParams() {
  return publishedArticles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug.get(slug);
  if (!a) return {};
  const url = site.baseUrl + "/blog/" + slug + "/";
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: a.metaTitle,
      description: a.metaDescription,
      url,
      type: "article",
      publishedTime: a.publishedDate,
      modifiedTime: a.updatedDate ?? a.publishedDate,
    },
  };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articleBySlug.get(slug);
  if (!a) notFound();
  const l = await getRequestLocation();
  const url = site.baseUrl + "/blog/" + slug + "/";
  if (l.slug !== "melbourne") permanentRedirect(url);
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.metaDescription,
          datePublished: a.publishedDate,
          dateModified: a.updatedDate ?? a.publishedDate,
          author: { "@type": "Organization", name: a.author },
          mainEntityOfPage: url,
        }}
      />
      <section className="page-hero">
        <div className="container page-hero-inner">
          <a href="/blog/">Plumbing advice</a>
          <h1>{a.title}</h1>
          <p>{a.excerpt}</p>
          <p>
            {a.author} ·{" "}
            <time dateTime={a.publishedDate}>{a.publishedDate}</time>
          </p>
        </div>
      </section>
      <article className="container manus-article-body">
        {a.heroImage && (
          <img src={a.heroImage} alt={a.heroImageAlt ?? a.title} />
        )}
        <nav aria-label="On this page">
          {a.sections.map((s, i) => (
            <a href={"#section-" + i} key={s.heading}>
              {s.heading} ·{" "}
            </a>
          ))}
        </nav>
        {a.sections.map((s, i) => (
          <section id={"section-" + i} key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.sourceUrls?.map((u) => (
              <p key={u}>
                <a href={u} target="_blank" rel="noopener noreferrer">
                  Supporting source
                </a>
              </p>
            ))}
          </section>
        ))}
        <section>
          <h2>Frequently asked questions</h2>
          {a.faq.map((f) => (
            <details key={f.question}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
        <section>
          <h2>Related services and locations</h2>
          <ul>
            {a.relatedServices.map((s) => (
              <li key={s}>
                <a href={site.baseUrl + serviceUrl(s)}>
                  {serviceBySlug.get(s)?.label ?? s}
                </a>
              </li>
            ))}
            {a.locationSlugs?.map((s) => {
              const local = getLocationBySlug(s);
              return local ? (
                <li key={s}>
                  <a href={local.website + "/"}>Plumbing in {local.location}</a>
                </li>
              ) : null;
            })}
          </ul>
        </section>
        <section>
          <h2>More plumbing advice</h2>
          {a.relatedArticles.map((s) => {
            const related = articleBySlug.get(s);
            return related ? (
              <p key={s}>
                <a href={"/blog/" + s + "/"}>{related.title}</a>
              </p>
            ) : null;
          })}
        </section>
        <section>
          <h2>Sources</h2>
          {a.sources?.map((s) => (
            <p key={s.url}>
              <a href={s.url}>{s.title}</a>
              {s.checkedDate && " · Checked " + s.checkedDate}
            </p>
          ))}
        </section>
        <QuoteForm />
      </article>
    </main>
  );
}
