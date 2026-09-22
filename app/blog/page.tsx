import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { publishedArticles } from "@/lib/articles";
import { getRequestLocation } from "@/lib/location-request";
import { brandAssets, site } from "@/lib/site";
export async function generateMetadata(): Promise<Metadata> {
  const l = await getRequestLocation();
  return {
    title: "Plumbing Guides | Grade A Plumbing",
    description:
      "Practical plumbing guides covering drains, sewer repairs, pipe relining and hot water.",
    alternates: { canonical: `${site.baseUrl}/blog/` },
    robots: l.slug === "melbourne" ? { index: true, follow: true } : { index: false, follow: true },
  };
}
export default async function Blog() {
  const l = await getRequestLocation();
  if (l.slug !== "melbourne") permanentRedirect(`${site.baseUrl}/blog/`);
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,184,212,.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(7,88,214,.14),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[.18em] text-brand-blue shadow-sm">
              Advice from Grade A Plumbing
            </span>
            <h1 className="mt-6 font-display text-6xl font-bold uppercase leading-[.88] tracking-[.03em] text-brand-navy">
              Plumbing guides for {l.location}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Clear, practical information about drains, sewer repairs, pipe
              relining and hot water—written to help you understand the problem
              before choosing a service.
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] shadow-soft">
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
      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedArticles.map((a, index) => (
              <article
                className={`group glass-surface overflow-hidden rounded-[1.75rem] ${index === 0 ? "md:col-span-2 lg:col-span-2" : ""}`}
                key={a.slug}
              >
                <div className="p-7">
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-blue">
                    Plumbing guide · {a.publishedDate}
                  </p>
                  <h2
                    className={`mt-4 font-display font-bold uppercase leading-[.95] text-brand-navy ${index === 0 ? "text-4xl sm:text-5xl" : "text-3xl"}`}
                  >
                    <Link href={`/blog/${a.slug}/`}>{a.title}</Link>
                  </h2>
                  <p className="mt-5 leading-8 text-slate-600">{a.excerpt}</p>
                  <Link
                    className="mt-7 inline-flex items-center gap-2 font-black text-brand-blue"
                    href={`/blog/${a.slug}/`}
                  >
                    Read the guide{" "}
                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
