import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { ContactForm } from "@/components/ContactForm";
import { CTASection } from "@/components/CTASection";
import { CustomerReviews } from "@/components/CustomerReviews";
import { FAQ } from "@/components/FAQ";
import { Icon, type IconName } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { TrustBadge } from "@/components/TrustBadge";
import { WorkShowcase } from "@/components/WorkShowcase";
import { getRequestLocation } from "@/lib/location-request";
import { JsonLd } from "@/lib/seo";
import { services, serviceUrl } from "@/lib/seo-services";
import {
  brandAssets,
  processSteps,
  site,
  trustBadges,
  whyChooseUs,
} from "@/lib/site";
import { formatStorefrontAddress } from "@/lib/storefronts";
import { publicMapsUrl } from "@/lib/google-business-profiles";

const serviceIcons: Record<string, IconName> = {
  "blocked-drains": "drain",
  "sewer-repairs": "pipe",
  "pipe-relining": "wrench",
  "hot-water": "water",
  "emergency-plumber": "alert",
  "burst-pipe-repair": "pipe",
  "gas-plumbing": "flame",
  "commercial-plumbing": "building",
};

export async function generateMetadata(): Promise<Metadata> {
  const location = await getRequestLocation();
  const title = `Plumber ${location.location} | Local & Emergency Plumbing | Grade A Plumbing`;
  const description = `Need a local plumber in ${location.location}? Grade A Plumbing provides drain, hot water, emergency, gas and commercial plumbing services.`;
  return {
    title,
    description,
    alternates: { canonical: `${location.website}/` },
    openGraph: {
      title,
      description,
      url: `${location.website}/`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  const location = await getRequestLocation();
  const mapsUrl = publicMapsUrl(location.googleBusinessProfile);
  const areas = location.nearbySuburbs.length
    ? location.nearbySuburbs
    : [location.location];
  const intro =
    location.localIntroduction ??
    `Reliable residential and commercial plumbing services in ${location.location}, with help for blocked drains, hot water faults, leaks and urgent plumbing enquiries.`;
  const faq = location.localFaqs?.length
    ? location.localFaqs
    : [
        {
          question: `What plumbing services are available in ${location.location}?`,
          answer:
            "Grade A Plumbing handles enquiries for blocked drains, sewer repairs, pipe relining, hot water, burst pipes, gas plumbing, commercial plumbing and urgent plumbing problems.",
        },
        {
          question: `Do you service properties near ${location.location}?`,
          answer: `Yes. Contact us with your suburb and we will confirm current service availability near ${location.location}.`,
        },
        {
          question: "Can I request a quote before work begins?",
          answer:
            "Tell us what is happening and we will explain the appropriate assessment and pricing process before work proceeds wherever possible.",
        },
      ];
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "Plumber"],
      "@id": `${location.website}/#business`,
      name: location.name,
      url: location.website,
      ...(location.phone ? { telephone: location.phone } : {}),
      email: site.email,
      image: `${location.website}${brandAssets.heroBanner.src}`,
      logo: `${location.website}${brandAssets.logo.src}`,
      priceRange: "$$",
      ...(mapsUrl ? { hasMap: mapsUrl } : {}),
      ...(location.address
        ? { address: { "@type": "PostalAddress", ...location.address } }
        : {}),
      areaServed: areas.map((name) => ({
        "@type": "Place",
        name: `${name}, VIC`,
      })),
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
      <JsonLd data={schemas} />
      <section className="relative overflow-hidden px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,184,212,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(7,88,214,0.14),transparent_36%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="max-w-xl py-6 lg:py-12">
              <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-brand-blue shadow-sm">
                {location.location} plumbing services
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.88] tracking-[0.03em] text-brand-navy sm:text-6xl lg:text-7xl">
                Local Plumber in {location.location}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                {intro}
              </p>
              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                <ButtonLink
                  className="gap-2"
                  href={location.phoneHref ?? site.phoneHref}
                >
                  <Icon name="phone" className="h-4 w-4" />
                  Call Now
                </ButtonLink>
                <ButtonLink
                  className="gap-2"
                  href="/contact#book-appointment"
                  variant="secondary"
                >
                  <Icon name="clock" className="h-4 w-4" />
                  Book Appointment
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary">
                  Request a Free Quote
                </ButtonLink>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {trustBadges.map((badge) => (
                  <TrustBadge key={badge} label={badge} />
                ))}
              </div>
            </div>
            <div className="relative pb-10 lg:pb-16">
              <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-soft">
                <Image
                  alt={brandAssets.heroBanner.alt}
                  className="h-auto w-full object-cover"
                  height={brandAssets.heroBanner.height}
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  src={brandAssets.heroBanner.src}
                  width={brandAssets.heroBanner.width}
                />
              </div>
              <div className="glass-surface mt-4 rounded-[1.75rem] p-5 sm:absolute sm:-bottom-4 sm:right-6 sm:mt-0 sm:w-[23rem]">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-blue text-white">
                    <Icon name="wrench" />
                  </span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
                      Tell us what you need
                    </p>
                    <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-brand-navy">
                      Request a Free Quote
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Send your details and a short description of the plumbing
                      issue.
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <ContactForm compact />
                </div>
              </div>
            </div>
          </div>
          <div className="glass-surface mt-8 grid gap-3 rounded-[1.5rem] p-4 text-brand-charcoal sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["phone", "Easy to contact"],
              ["alert", "Urgent enquiries"],
              ["pipe", `${location.location} service`],
              ["building", "Residential and commercial"],
            ].map(([icon, label]) => (
              <div
                className="flex items-center gap-3 rounded-xl px-2 py-2"
                key={label}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-blue shadow-sm">
                  <Icon name={icon as IconName} className="h-5 w-5" />
                </span>
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CustomerReviews locationSlug={location.slug} />

      {(location.address || mapsUrl) && (
        <section className="border-y border-blue-100 bg-white/70 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
                {location.location} storefront
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase text-brand-navy">
                Visit or contact our local team
              </h2>
              {location.address ? (
                <p className="mt-2 text-slate-600">{formatStorefrontAddress(location.address)}</p>
              ) : (
                <p className="mt-2 text-slate-600">Serving {location.location} and nearby suburbs.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {mapsUrl && <ButtonLink href={mapsUrl} variant="secondary">View on Google Maps</ButtonLink>}
              <ButtonLink href="/contact/" variant="secondary">Contact this location</ButtonLink>
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[2rem] shadow-soft">
              <Image
                alt={brandAssets.team.alt}
                className="h-auto w-full object-cover"
                height={brandAssets.team.height}
                sizes="(min-width: 1024px) 36vw, 100vw"
                src={brandAssets.team.src}
                width={brandAssets.team.width}
              />
            </div>
            <div className="glass-surface flex items-center gap-4 rounded-[1.5rem] p-4">
              <Image
                alt={brandAssets.logo.alt}
                className="h-20 w-20 rounded-xl bg-white p-2 shadow-sm"
                height={80}
                src={brandAssets.logo.src}
                width={80}
              />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-blue">
                  Grade A Plumbing
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Local plumbing support backed by real team and project
                  photography.
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
              Why choose us
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              Practical plumbing help for {location.location} properties
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              From the first call through to the final check, our focus is clear
              communication, careful work and a sensible next step for the
              problem in front of us.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {whyChooseUs.map((item) => (
                <div
                  className="glass-surface flex items-start gap-3 rounded-[1.25rem] p-4"
                  key={item}
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-blue text-white">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  <p className="font-semibold text-brand-charcoal">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 overflow-hidden rounded-[2rem] shadow-soft">
              <Image
                alt={brandAssets.landscapePlumber.alt}
                className="h-auto w-full object-cover"
                height={brandAssets.landscapePlumber.height}
                sizes="(min-width: 1024px) 58vw, 100vw"
                src={brandAssets.landscapePlumber.src}
                width={brandAssets.landscapePlumber.width}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
                What we offer
              </p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
                Plumbing services in {location.location}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Dedicated service pages explain the problems we help with, the
                likely next steps and related plumbing options.
              </p>
            </div>
            <div className="glass-surface rounded-[1.5rem] p-5">
              <p className="text-sm leading-7 text-slate-600">
                Call for an urgent issue or request a quote online. Include your
                suburb and any useful photos so we can understand what is
                happening.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                description={service.description(location.location)}
                href={serviceUrl(service.slug)}
                icon={serviceIcons[service.slug]}
                key={service.slug}
                title={`${service.label} ${location.location}`}
              />
            ))}
          </div>
        </div>
      </section>

      <WorkShowcase
        actionHref="/contact"
        actionLabel="Request a Free Quote"
        description="Genuine project photography helps visitors understand the range and finish of plumbing work completed by Grade A Plumbing."
        limit={7}
        note="Have a similar plumbing job? Include a photo with your quote request so we can better understand the work before calling you back."
        title={`Recent plumbing work for homes and businesses near ${location.location}`}
      />

      <section className="relative overflow-hidden bg-brand-navy py-20 text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="h-full w-full bg-water-grid bg-[length:24px_24px]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
              Service area
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] sm:text-6xl">
              Areas we service near {location.location}
            </h2>
            <p className="mt-5 text-base leading-8 text-blue-50/85">
              We service the surrounding suburbs listed here. Contact us with
              your address and plumbing issue to confirm current availability.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {areas.map((area) => (
              <div
                key={area}
                className="rounded-[1.25rem] border border-white/15 bg-white/10 px-5 py-4 font-semibold backdrop-blur"
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
              Our process
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              A clear process from first contact to final check
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <article
                className="glass-surface rounded-[1.5rem] p-5"
                key={step.title}
              >
                <span className="text-sm font-bold uppercase tracking-[0.24em] text-brand-blue">
                  0{index + 1}
                </span>
                <h3 className="mt-5 font-display text-3xl font-bold uppercase leading-tight text-brand-navy">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
              FAQs
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              {location.location} plumbing questions
            </h2>
          </div>
          <FAQ items={faq} />
        </div>
      </section>

      <CTASection
        text={`Call Grade A Plumbing or request a quote for plumbing services in ${location.location}.`}
        title={`Need a plumber in ${location.location}?`}
      />
    </>
  );
}
