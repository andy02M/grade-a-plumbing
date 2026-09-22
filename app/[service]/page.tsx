import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/ButtonLink";
import { CTASection } from "@/components/CTASection";
import { FAQ } from "@/components/FAQ";
import { Icon } from "@/components/Icon";
import { getRequestLocation } from "@/lib/location-request";
import {
  locationHasService,
  serviceBySlug,
  services,
  serviceUrl,
} from "@/lib/seo-services";
import { JsonLd } from "@/lib/seo";
import { brandAssets, site } from "@/lib/site";

const serviceImages: Record<string, { src: string; alt: string }> = {
  "blocked-drains": {
    src: "/work-showcase/drain-connection-detail.png",
    alt: "External drainage connection completed by Grade A Plumbing",
  },
  "sewer-repairs": {
    src: brandAssets.repairWork.src,
    alt: brandAssets.repairWork.alt,
  },
  "pipe-relining": {
    src: brandAssets.repairWork.src,
    alt: brandAssets.repairWork.alt,
  },
  "hot-water": {
    src: "/work-showcase/hot-water-system-upgrade.png",
    alt: "Outdoor hot water system with new copper pipework",
  },
  "emergency-plumber": {
    src: brandAssets.serviceVan.src,
    alt: brandAssets.serviceVan.alt,
  },
  "burst-pipe-repair": {
    src: brandAssets.repairWork.src,
    alt: brandAssets.repairWork.alt,
  },
  "gas-plumbing": {
    src: "/work-showcase/hot-water-system-wall-install.png",
    alt: "Wall-mounted gas hot water unit and insulated pipework",
  },
  "commercial-plumbing": {
    src: brandAssets.homeVisit.src,
    alt: brandAssets.homeVisit.alt,
  },
};
export function generateStaticParams() {
  return services.map((service) => ({ service: service.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}): Promise<Metadata> {
  const { service: slug } = await params;
  const definition = serviceBySlug.get(slug);
  if (!definition) return {};
  const location = await getRequestLocation();
  const title = definition.title(location.location),
    description = definition.description(location.location),
    url = `${location.website}${serviceUrl(slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: locationHasService(location)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}
export default async function MoneyPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: slug } = await params;
  const definition = serviceBySlug.get(slug);
  if (!definition) notFound();
  const location = await getRequestLocation();
  const url = `${location.website}${serviceUrl(slug)}`,
    faq = definition.faqs(location.location),
    related = definition.related
      .map((s) => serviceBySlug.get(s))
      .filter(Boolean),
    areaNames = location.nearbySuburbs.length
      ? location.nearbySuburbs
      : [location.location],
    image = serviceImages[slug] ?? {
      src: brandAssets.serviceVan.src,
      alt: brandAssets.serviceVan.alt,
    };
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${definition.label} ${location.location}`,
      serviceType: definition.serviceType,
      url,
      description: definition.description(location.location),
      provider: {
        "@type": ["LocalBusiness", "Plumber"],
        "@id": `${location.website}/#business`,
        name: location.name,
        url: location.website,
        ...(location.phone ? { telephone: location.phone } : {}),
        email: site.email,
        ...(location.address
          ? { address: { "@type": "PostalAddress", ...location.address } }
          : {}),
      },
      areaServed: areaNames.map((name) => ({
        "@type": "Place",
        name: `${name}, VIC`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${location.website}/`,
        },
        { "@type": "ListItem", position: 2, name: definition.label, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: definition.label, href: serviceUrl(slug) },
        ]}
      />
      <section className="relative overflow-hidden px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,184,212,.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(7,88,214,.14),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[.18em] text-brand-blue shadow-sm">
              {definition.label} · {location.location}
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[.88] tracking-[.03em] text-brand-navy sm:text-6xl lg:text-7xl">
              {definition.h1(location.location)}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {definition.intro(location.location)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink
                className="gap-2"
                href={location.phoneHref ?? site.phoneHref}
              >
                <Icon name="phone" className="h-4 w-4" />
                Call {location.phone ?? site.phone}
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Request Service
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-soft">
              <Image
                fill
                priority
                src={image.src}
                alt={image.alt}
                className="object-cover"
                sizes="(min-width:1024px) 55vw,100vw"
              />
            </div>
            <div className="glass-surface absolute -bottom-5 left-5 right-5 rounded-[1.5rem] p-5 sm:left-auto sm:w-80">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-blue">
                Need help?
              </p>
              <p className="mt-2 font-display text-2xl font-bold uppercase text-brand-navy">
                Speak with a plumber
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tell us the issue and your suburb so we can discuss the next
                step.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
              How we help
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9] text-brand-navy">
              {definition.label} services in {location.location}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {definition.sections.map((section, i) => (
              <article
                className="group glass-surface rounded-[1.75rem] p-6 transition hover:-translate-y-1"
                key={section.title}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-blue font-black text-white">
                  0{i + 1}
                </span>
                <h3 className="mt-6 font-display text-3xl font-bold uppercase leading-none text-brand-navy">
                  {i === 0
                    ? `${section.title} in ${location.location}`
                    : section.title}
                </h3>
                <p className="mt-4 leading-8 text-slate-600">{section.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden bg-brand-navy py-20 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-water-grid bg-[length:24px_24px]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-100">
              Local coverage
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9]">
              Areas near {location.location} we service
            </h2>
            <p className="mt-5 leading-8 text-blue-50/80">
              Contact us to confirm current availability for your address.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {areaNames.map((area) => (
              <div
                className="rounded-[1.25rem] border border-white/15 bg-white/10 px-5 py-4 font-semibold backdrop-blur"
                key={area}
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
                Keep exploring
              </p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9] text-brand-navy">
                Related plumbing services
              </h2>
              <div className="mt-7 grid gap-3">
                {related.map((item) => (
                  <Link
                    className="glass-surface group flex items-center justify-between rounded-[1.25rem] px-5 py-4 font-bold text-brand-navy"
                    key={item!.slug}
                    href={serviceUrl(item!.slug)}
                  >
                    <span>
                      {item!.label} in {location.location}
                    </span>
                    <span className="text-brand-blue transition group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-blue">
                Common questions
              </p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[.9] text-brand-navy">
                Frequently asked questions
              </h2>
              <div className="mt-8">
                <FAQ items={faq} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <CTASection
        title={`Need ${definition.shortLabel.toLowerCase()} in ${location.location}?`}
        text="Call Grade A Plumbing or send a quote request with your suburb and a short description of the problem."
      />
    </>
  );
}
