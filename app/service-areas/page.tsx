import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/ButtonLink";
import { CoreLocationCards } from "@/components/CoreLocationCards";
import { CTASection } from "@/components/CTASection";
import { Hero } from "@/components/Hero";
import { Icon } from "@/components/Icon";
import { ServiceAreaGrid } from "@/components/ServiceAreaGrid";
import { site, suburbGroups } from "@/lib/site";
import { breadcrumbSchema, createMetadata, JsonLd, localBusinessSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Plumber Melbourne, St Kilda, South Melbourne & Richmond | Grade A Plumbing",
  description:
    "Looking for a plumber in Melbourne, St Kilda, South Melbourne, or Richmond? Grade A Plumbing services inner Melbourne suburbs for emergency plumbing, blocked drains, hot water repairs, and commercial plumbing.",
  path: "/service-areas",
  keywords: [
    "plumber Melbourne",
    "plumber St Kilda",
    "plumber South Melbourne",
    "plumber Richmond",
    "emergency plumber South Melbourne",
    "blocked drains St Kilda"
  ]
});

export default function ServiceAreasPage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Melbourne Plumbing Service Areas",
            description:
              "Suburb directory for Grade A Plumbing service areas across Melbourne VIC and surrounding suburbs.",
            url: `${site.baseUrl}/service-areas`,
            about: suburbGroups.map((group) => group.region)
          },
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Service Areas", href: "/service-areas" }
          ])
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Service Areas", href: "/service-areas" }
        ]}
      />
      <Hero
        badge="Melbourne plumbing service areas"
        text="Grade A Plumbing services Melbourne CBD, St Kilda, South Melbourne, Richmond, and surrounding suburbs across inner, north, west, east, and south east Melbourne."
        title="Plumber Melbourne, St Kilda, South Melbourne and Richmond"
      >
        <div className="rounded-md border border-blue-100 bg-white p-6 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-blue text-white">
            <Icon name="home" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-black text-brand-navy">
            Not sure if we service your suburb?
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Call or send a quote request with your suburb and the plumbing issue. We will confirm availability and the clearest next step.
          </p>
          <div className="mt-6 grid gap-3 sm:flex">
            <ButtonLink className="gap-2" href={site.phoneHref}>
              <Icon name="phone" className="h-4 w-4" />
              Call Now
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Request Quote
            </ButtonLink>
          </div>
        </div>
      </Hero>

      <section className="bg-brand-mist py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              Core inner-Melbourne areas
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              Popular inner-Melbourne plumbing service areas
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              If you are searching for a plumber in Melbourne, St Kilda, South Melbourne, or Richmond, these are some of the main inner-Melbourne areas we service for emergency plumbing, blocked drains, hot water repairs, and local plumbing enquiries.
            </p>
          </div>
          <div className="mt-10">
            <CoreLocationCards />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              Suburb directory
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              Melbourne suburbs we service
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Browse our main service regions below. Each suburb is listed clearly so local customers can quickly check coverage.
            </p>
          </div>
          <div className="mt-10">
            <ServiceAreaGrid />
          </div>
          <p className="mt-8 rounded-md border border-blue-100 bg-white p-5 font-semibold text-brand-charcoal shadow-sm">
            If your suburb is not listed, contact us to check availability.
          </p>
        </div>
      </section>

      <CTASection
        text="Call Grade A Plumbing or request a free quote with your suburb and service details."
        title="Need a plumber in Melbourne, St Kilda, South Melbourne or Richmond?"
      />
    </>
  );
}
