import Image from "next/image";
import { ButtonLink } from "@/components/ButtonLink";
import { ContactForm } from "@/components/ContactForm";
import { CoreLocationCards } from "@/components/CoreLocationCards";
import { CTASection } from "@/components/CTASection";
import { FAQ } from "@/components/FAQ";
import { Icon } from "@/components/Icon";
import { ServiceAreaGrid } from "@/components/ServiceAreaGrid";
import { ServiceCard } from "@/components/ServiceCard";
import { TrustBadge } from "@/components/TrustBadge";
import { WorkShowcase } from "@/components/WorkShowcase";
import {
  brandAssets,
  homepageFaqs,
  primaryServices,
  processSteps,
  site,
  trustBadges,
  whyChooseUs
} from "@/lib/site";
import {
  breadcrumbSchema,
  createMetadata,
  faqSchema,
  JsonLd,
  localBusinessSchema,
  serviceSchema
} from "@/lib/seo";

export const metadata = createMetadata({
  title: "Grade A Plumbing Melbourne | Local Plumber Melbourne VIC",
  description:
    "Grade A Plumbing provides reliable plumbing services across Melbourne, St Kilda, South Melbourne, and Richmond for emergency callouts, blocked drains, hot water repairs, commercial plumbing, leaks, burst pipes, and maintenance.",
  path: "/",
  keywords: [
    "plumber Melbourne",
    "plumbing Melbourne",
    "Grade A Plumbing",
    "emergency plumber Melbourne",
    "blocked drains Melbourne",
    "plumber St Kilda",
    "plumber South Melbourne",
    "plumber Richmond"
  ]
});

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          ...primaryServices.slice(0, 4).map((service) =>
            serviceSchema({
              name: service.title,
              description: service.description,
              path: service.href,
              serviceType: service.title
            })
          ),
          faqSchema(homepageFaqs),
          breadcrumbSchema([{ name: "Home", href: "/" }])
        ]}
      />

      <section className="relative overflow-hidden px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,184,212,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(7,88,214,0.12),transparent_36%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="max-w-xl py-6 lg:py-12">
              <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-brand-blue shadow-sm">
                Melbourne Plumbing Services
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.88] tracking-[0.03em] text-brand-navy sm:text-6xl lg:text-7xl">
                Grade A Plumbing Melbourne
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Fast, reliable plumbing services across Melbourne, St Kilda, South Melbourne, Richmond, and surrounding suburbs for homes, businesses, and emergency callouts.
              </p>
              <div className="mt-8 grid gap-3 sm:flex">
                <ButtonLink className="gap-2" href={site.phoneHref}>
                  <Icon name="phone" className="h-4 w-4" />
                  Call Now
                </ButtonLink>
                <ButtonLink className="gap-2" href="/contact#book-appointment" variant="secondary">
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
                      Fast response
                    </p>
                    <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-brand-navy">
                      Request a Free Quote
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Need urgent plumbing help in Melbourne? Call Grade A Plumbing now.
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
              ["clock", "Fast response"],
              ["alert", "Emergency help"],
              ["pipe", "Melbourne wide"],
              ["building", "Residential and commercial"]
            ].map(([icon, label]) => (
              <div className="flex items-center gap-3 rounded-xl px-2 py-2" key={label}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-blue shadow-sm">
                  <Icon name={icon as "clock"} className="h-5 w-5" />
                </span>
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/60 bg-white/75 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm font-bold text-brand-charcoal sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>Need urgent plumbing help in Melbourne? Call Grade A Plumbing now.</span>
          <a className="inline-flex items-center gap-2 text-brand-blue hover:text-blue-700" href={site.phoneHref}>
            <Icon name="phone" className="h-4 w-4" />
            {site.phone}
          </a>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[2rem] shadow-soft">
              <Image
                alt={brandAssets.team.alt}
                className="h-auto w-full object-cover"
                height={brandAssets.team.height}
                src={brandAssets.team.src}
                width={brandAssets.team.width}
              />
            </div>
            <div className="glass-surface flex items-center gap-4 rounded-[1.5rem] p-4">
              <Image
                alt={brandAssets.logo.alt}
                className="h-20 w-20 rounded-xl bg-white p-2 shadow-sm"
                height={brandAssets.logo.height}
                src={brandAssets.logo.src}
                width={brandAssets.logo.width}
              />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-blue">
                  Quality you can trust
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Clean branding, real team photography, and actual service visuals now anchor the site.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">Melbourne based</p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              Real team. Real work. Strong first impression.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              These assets give the site something it was missing: actual company presence. Grade A Plumbing now looks like a real service business with a branded vehicle, a recognisable team, and on-site work that people can immediately trust.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {whyChooseUs.map((item) => (
                <div className="glass-surface flex items-start gap-3 rounded-[1.25rem] p-4" key={item}>
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
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">What we offer</p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
                Plumbing support with a cleaner, stronger visual feel.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                The service pages still drive leads, but the site now looks more established and polished. The updated font system also fits the van branding better than the older serif direction.
              </p>
            </div>
            <div className="glass-surface rounded-[1.5rem] p-5">
              <p className="text-sm leading-7 text-slate-600">
                You call, we assess the issue, explain the likely cause, and give you a clear next step. That could be emergency plumbing, blocked drain work, hot water repairs, commercial support, or general plumbing maintenance.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {primaryServices.map((service) => (
              <ServiceCard
                description={service.description}
                href={service.href}
                icon={service.icon}
                key={service.title}
                title={service.title}
              />
            ))}
          </div>
        </div>
      </section>

      <WorkShowcase
        actionHref="/contact"
        actionLabel="Request a Free Quote"
        description="Real photos from recent hot water, bathroom, kitchen, toilet, and drainage work help visitors see the standard of finish they can expect from Grade A Plumbing across Melbourne."
        limit={10}
        note="If your plumbing issue looks similar, send through a quote request and include a photo. That usually makes it easier to explain the job and the likely next step."
        title="See the kind of plumbing work we complete in Melbourne homes"
      />

      <section className="relative overflow-hidden bg-brand-navy py-20 text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="h-full w-full bg-water-grid bg-[length:24px_24px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">Service area</p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] sm:text-6xl">
                Melbourne suburbs and surrounding areas
              </h2>
              <p className="mt-5 text-base leading-8 text-blue-50/85">
                We service Melbourne CBD, St Kilda, South Melbourne, Richmond, and surrounding suburbs across inner, north, west, east, and south east Melbourne.
              </p>
              <p className="mt-4 font-semibold text-white">If your suburb is not listed, contact us to check availability.</p>
            </div>
            <ServiceAreaGrid />
          </div>
        </div>
      </section>

      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
              Local plumber searches
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              Plumber Melbourne, St Kilda, South Melbourne and Richmond
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              These are some of the inner-Melbourne areas we regularly service for emergency plumbing, blocked drains, hot water repairs, leaks, and commercial plumbing support.
            </p>
          </div>
          <div className="mt-10">
            <CoreLocationCards />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">Our process</p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              A simple plumbing process from first call to final check
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <article className="glass-surface rounded-[1.5rem] p-5" key={step.title}>
                <span className="text-sm font-bold uppercase tracking-[0.24em] text-brand-blue">0{index + 1}</span>
                <h3 className="mt-5 font-display text-3xl font-bold uppercase leading-tight text-brand-navy">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/55 py-20 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">FAQs</p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              Melbourne plumbing questions
            </h2>
          </div>
          <FAQ items={homepageFaqs} />
        </div>
      </section>

      <CTASection
        text="Call Grade A Plumbing or request a free quote today."
        title="Need a reliable plumber in Melbourne?"
      />
    </>
  );
}
