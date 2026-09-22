import Link from "next/link";
import type { Metadata } from "next";
import { CTASection } from "@/components/CTASection";
import { Icon } from "@/components/Icon";
import { getRequestLocation } from "@/lib/location-request";
import { locations } from "@/lib/locations";
import { services, serviceUrl } from "@/lib/seo-services";
export async function generateMetadata(): Promise<Metadata> {
  const l = await getRequestLocation();
  return {
    title: `Plumbing Service Areas Near ${l.location} | Grade A Plumbing`,
    description: `Check Grade A Plumbing service coverage in ${l.location} and surrounding Victorian suburbs.`,
    alternates: { canonical: `${l.website}/service-areas/` },
  };
}
export default async function ServiceAreasPage() {
  const l = await getRequestLocation();
  const nearby = l.nearbySuburbs.length ? l.nearbySuburbs : [l.location];
  return (
    <>
      <section className="relative overflow-hidden bg-brand-navy px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="hero-mesh absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.8fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-100">
              Local coverage
            </p>
            <h1 className="mt-5 font-display text-6xl font-bold uppercase leading-[.88]">
              Plumbing service areas near {l.location}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/85">
              Check the configured service areas below, or contact us with your
              suburb and plumbing issue to confirm availability.
            </p>
          </div>
          <div className="glass-surface rounded-[2rem] p-6 text-brand-navy">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-blue text-white">
              <Icon name="home" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold uppercase leading-none">
              Not sure about your suburb?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Send your address area and a short description of the work. We
              will confirm the appropriate next step.
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-brand-blue px-5 py-3 font-black text-white"
              href="/contact/"
            >
              Check availability
            </Link>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
            Closest coverage
          </p>
          <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9] text-brand-navy">
            Areas around {l.location}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((area) => (
              <article
                className="glass-surface rounded-[1.5rem] p-5"
                key={area}
              >
                <p className="font-display text-2xl font-bold uppercase text-brand-navy">
                  {area}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Contact Grade A Plumbing to confirm service availability for
                  this area.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
                Across Victoria
              </p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9] text-brand-navy">
                Grade A location network
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Browse every Grade A Plumbing storefront and its local service
                information. Each location has its own contact and coverage page.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {locations.map((item) => (
                <Link
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${item.slug === l.slug ? "border-brand-blue bg-brand-blue text-white" : "border-blue-100 bg-white text-brand-navy"}`}
                  href={`${item.website}/`}
                  key={item.slug}
                >
                  {item.location}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
            Services
          </p>
          <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9] text-brand-navy">
            What we can help with
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={serviceUrl(service.slug)}
                className="glass-surface rounded-[1.25rem] p-5 font-bold text-brand-navy hover:text-brand-blue"
              >
                {service.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CTASection
        title={`Need a plumber near ${l.location}?`}
        text="Call Grade A Plumbing or request a quote with your suburb and service details."
      />
    </>
  );
}
