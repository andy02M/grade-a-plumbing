import Image from "next/image";
import Link from "next/link";
import { publishedArticles } from "@/lib/articles";
import { brandAssets, site } from "@/lib/site";

export function ArticlesSection({ locationSlug }: { locationSlug: string }) {
  const latest = [...publishedArticles].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
  const local = locationSlug === "melbourne" ? [] : latest.filter(a => a.locationSlugs?.includes(locationSlug));
  const selected = [...local, ...latest.filter(a => !local.includes(a))].slice(0, 3);
  if (!selected.length) return null;
  return (
    <section id="articles" aria-labelledby="articles-heading" className="border-y border-blue-100 bg-white/65 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">Plumbing advice & articles</p>
            <h2 id="articles-heading" className="mt-3 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Helpful guides for your home or business</h2>
            <p className="mt-4 leading-7 text-slate-600">Understand warning signs, compare your options and know what to ask before booking a plumber.</p>
          </div>
          <Link href={`${site.baseUrl}/blog/`} className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-blue px-6 py-3 font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">View all articles <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {selected.map((article, index) => (
            <article key={article.slug} className="group flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <Link href={`${site.baseUrl}/blog/${article.slug}/`} tabIndex={-1} aria-hidden="true" className="block overflow-hidden">
                <Image src={article.heroImage ?? brandAssets.repairWork.src} alt="" width={640} height={360} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105" />
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">{index === 0 && !local.length ? "Latest article" : "Plumbing guide"} · <time dateTime={article.publishedDate}>{new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Sydney" }).format(new Date(`${article.publishedDate}T00:00:00Z`))}</time></p>
                <h3 className="mt-3 text-xl font-bold leading-snug text-brand-navy"><Link href={`${site.baseUrl}/blog/${article.slug}/`} className="hover:text-brand-blue">{article.title}</Link></h3>
                <p className="mb-6 mt-3 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                <Link href={`${site.baseUrl}/blog/${article.slug}/`} className="mt-auto font-bold text-brand-blue" aria-label={`Read ${article.title}`}>Read article <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
