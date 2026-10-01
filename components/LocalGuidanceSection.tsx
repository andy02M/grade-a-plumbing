import Link from "next/link";
import { localGuidance } from "@/lib/local-guidance";
import { serviceBySlug, serviceUrl } from "@/lib/seo-services";

export function LocalGuidanceSection({ slug, location }: { slug: string; location: string }) {
  const guidance = localGuidance[slug];
  if (!guidance) return null;
  return (
    <section className="py-20" aria-labelledby="local-guidance-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">Local property guidance · {location}</p>
        <div className="mt-5 grid gap-10 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <h2 id="local-guidance-heading" className="font-display text-4xl font-bold uppercase leading-tight text-brand-navy">{guidance.heading}</h2>
            {guidance.paragraphs.map(paragraph => <p key={paragraph} className="mt-5 leading-8 text-slate-600">{paragraph}</p>)}
            <div className="mt-6 flex flex-wrap gap-3">
              {guidance.relatedServices.map(service => <Link key={service} href={serviceUrl(service)} className="rounded-full bg-white px-4 py-2 font-semibold text-brand-blue shadow-sm">{serviceBySlug.get(service)?.label} in {location}</Link>)}
            </div>
          </div>
          <aside className="glass-surface rounded-[1.75rem] p-6">
            <h3 className="text-xl font-bold text-brand-navy">Official information for property owners</h3>
            <ul className="mt-5 space-y-4">
              {guidance.sources.map(source => <li key={source.url}><a href={source.url} className="font-semibold text-brand-blue underline underline-offset-4">{source.title}</a></li>)}
            </ul>
            <p className="mt-6 text-sm leading-6 text-slate-600">Sources checked <time dateTime={guidance.checkedDate}>{guidance.checkedDate}</time>. Confirm current requirements with the relevant authority for your property. This information is not a site assessment or an approval.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
