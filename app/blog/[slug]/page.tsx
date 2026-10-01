import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CTASection } from "@/components/CTASection";
import { FAQ } from "@/components/FAQ";
import { articleBySlug, publishedArticles } from "@/lib/articles";
import { getLocationBySlug } from "@/lib/locations";
import { getRequestLocation } from "@/lib/location-request";
import { serviceBySlug, serviceUrl } from "@/lib/seo-services";
import { JsonLd } from "@/lib/seo";
import { brandAssets, site } from "@/lib/site";
export function generateStaticParams() {
  return publishedArticles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    a = articleBySlug.get(slug);
  if (!a) return {};
  const l = await getRequestLocation();
  const url = `${site.baseUrl}/blog/${a.slug}/`;
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: a.metaTitle,
      description: a.metaDescription,
      type: "article",
      url,
      publishedTime: a.publishedDate,
      modifiedTime: a.updatedDate ?? a.publishedDate,
    },
    robots: l.slug === "melbourne" ? { index: true, follow: true } : { index: false, follow: true },
  };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    a = articleBySlug.get(slug);
  if (!a) notFound();
  const l = await getRequestLocation(),
    related = a.relatedServices
      .map((s) => serviceBySlug.get(s))
      .filter(Boolean),
    schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.metaDescription,
      datePublished: a.publishedDate,
      ...(a.updatedDate ? { dateModified: a.updatedDate } : {}),
      author: { "@type": "Organization", name: a.author },
      publisher: { "@type": "Organization", name: l.name },
      mainEntityOfPage: `${site.baseUrl}/blog/${a.slug}/`,
    };
  if (l.slug !== "melbourne") permanentRedirect(`${site.baseUrl}/blog/${a.slug}/`);
  return (
    <>
      <JsonLd data={schema} />
      <section className="relative overflow-hidden bg-brand-navy px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="hero-mesh absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.72fr] lg:items-center">
          <div>
            <nav className="text-sm text-blue-100">
              <Link href="/blog/" className="font-bold">
                Plumbing guides
              </Link>{" "}
              <span className="mx-2">/</span> {l.location}
            </nav>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {a.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-blue-50/85">
              {a.excerpt}
            </p>
            <p className="mt-6 text-sm font-semibold text-blue-100">
              By {a.author} · Published {a.publishedDate}
              {a.updatedDate && <> · Updated <time dateTime={a.updatedDate}>{a.updatedDate}</time></>}
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl">
            <Image
              src={brandAssets.repairWork.src}
              alt={brandAssets.repairWork.alt}
              width={brandAssets.repairWork.width}
              height={brandAssets.repairWork.height}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
        <article className="min-w-0">
          <nav aria-label="Article contents" className="mb-8 rounded-2xl border border-blue-100 bg-white p-6">
            <h2 className="text-lg font-bold text-brand-navy">In this guide</h2>
            <ul className="mt-3 grid gap-2">{a.sections.map((section,index)=><li key={section.heading}><a className="text-brand-blue hover:underline" href={`#section-${index+1}`}>{section.heading}</a></li>)}</ul>
          </nav>
          {a.locationSlugs?.length ? <nav aria-label="Locations covered" className="mb-8 rounded-xl bg-blue-50 p-5">{a.locationSlugs.map(slug => { const location = getLocationBySlug(slug); return <a key={slug} href={location.website} className="font-bold text-brand-blue hover:underline">Plumbing services in {location.location} →</a>; })}</nav> : null}
          {a.sections.map((s, index) => (
            <section id={`section-${index+1}`} className={`scroll-mt-28 ${index ? "mt-14" : ""}`} key={s.heading}>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
                0{index + 1}
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-brand-navy sm:text-3xl">
                {s.heading}
              </h2>
              {s.paragraphs.map((p) => (
                <p className="mt-5 text-lg leading-9 text-slate-700" key={p}>
                  {p}
                </p>
              ))}
              {s.sourceUrls?.length ? <p className="mt-4 text-sm leading-6 text-slate-600">Supporting guidance: {s.sourceUrls.map((url,index) => { const source=a.sources?.find(item=>item.url===url); return source ? <span key={url}>{index ? " · " : ""}<a className="text-brand-blue underline underline-offset-4" href={url}>{source.title}</a></span> : null; })}</p> : null}
            </section>
          ))}
          {a.faq.length > 0 && (
            <section className="mt-16">
              <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
                Common questions
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase text-brand-navy">
                Frequently asked questions
              </h2>
              <div className="mt-7">
                <FAQ items={a.faq} />
              </div>
            </section>
          )}
          {a.relatedArticles.length > 0 && <section className="mt-12"><h2 className="text-2xl font-bold text-brand-navy">Related plumbing guides</h2><div className="mt-4 grid gap-3">{a.relatedArticles.map(slug => { const article = articleBySlug.get(slug); return article ? <Link key={slug} href={`/blog/${slug}/`} className="text-brand-blue hover:underline">{article.title}</Link> : null; })}</div></section>}
          {a.sources?.length ? <section className="mt-12 rounded-2xl bg-blue-50 p-6"><h2 className="text-2xl font-bold text-brand-navy">Sources and further reading</h2><p className="mt-3 text-sm leading-6 text-slate-600">Official guidance supporting the topics discussed. Site assessment and current product instructions take precedence over general information.</p><ul className="mt-4 grid gap-3">{a.sources.map(source=><li key={source.url}><a href={source.url} className="text-brand-blue hover:underline">{source.title}</a></li>)}</ul></section> : null}
        </article>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass-surface rounded-[1.75rem] p-6">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-blue">
              Related services
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-none text-brand-navy">
              Need practical help?
            </h2>
            <div className="mt-6 grid gap-3">
              <a href={site.phoneHref} className="font-bold text-brand-blue">Call {site.phone}</a>
              <a href={site.emailHref} className="break-all text-brand-blue hover:underline">{site.email}</a>
              {related.map((s) => (
                <Link
                  key={s!.slug}
                  className="rounded-xl bg-white px-4 py-3 font-bold text-brand-navy shadow-sm hover:text-brand-blue"
                  href={serviceUrl(s!.slug)}
                >
                  {s!.label} in {l.location} →
                </Link>
              ))}
            </div>
            <Link
              className="mt-5 inline-flex rounded-full bg-brand-blue px-5 py-3 font-black text-white"
              href="/contact/"
            >
              Request service
            </Link>
          </div>
        </aside>
      </div>
      <CTASection
        title={`Need plumbing help in ${l.location}?`}
        text="Call Grade A Plumbing or send a quote request with a short description of the issue."
      />
    </>
  );
}
