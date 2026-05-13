import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/ButtonLink";
import { CalendlyBookingSection } from "@/components/CalendlyBookingSection";
import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/Icon";
import { WorkShowcase } from "@/components/WorkShowcase";
import { site } from "@/lib/site";
import { breadcrumbSchema, createMetadata, JsonLd, localBusinessSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact Grade A Plumbing Melbourne | Request a Free Quote",
  description:
    "Contact Grade A Plumbing for plumbing enquiries across Melbourne, St Kilda, South Melbourne, Richmond, and surrounding suburbs, including emergency plumbing, blocked drains, hot water repairs, and free quote requests.",
  path: "/contact",
  keywords: [
    "contact plumber Melbourne",
    "plumbing quote Melbourne",
    "Grade A Plumbing contact",
    "emergency plumber Melbourne",
    "plumber St Kilda",
    "plumber South Melbourne",
    "plumber Richmond"
  ]
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact Grade A Plumbing Melbourne",
            url: `${site.baseUrl}/contact`,
            mainEntity: {
              "@type": ["LocalBusiness", "Plumber"],
              name: site.name,
              telephone: site.phone,
              email: site.email,
              areaServed: site.serviceArea
            }
          },
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Contact", href: "/contact" }
          ])
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" }
        ]}
      />

      <section className="relative overflow-hidden bg-white py-16">
        <div className="absolute inset-0 bg-hero-flow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-black text-brand-blue shadow-sm">
              Contact Grade A Plumbing
            </span>
            <h1 className="mt-5 font-display text-4xl font-black tracking-normal text-brand-navy sm:text-5xl">
              Request a free plumbing quote in Melbourne
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Tell us what plumbing help you need, your suburb, and the best way to reach you. We service Melbourne CBD, St Kilda, South Melbourne, Richmond, and surrounding suburbs. For urgent plumbing problems, call now.
            </p>

            <div className="mt-8 grid gap-3 sm:flex">
              <ButtonLink className="gap-2" href={site.phoneHref}>
                <Icon name="phone" className="h-4 w-4" />
                Call Now
              </ButtonLink>
              <ButtonLink className="gap-2" href="#book-appointment" variant="secondary">
                <Icon name="clock" className="h-4 w-4" />
                Book Appointment
              </ButtonLink>
              <ButtonLink href={site.emailHref} variant="secondary">
                Email Us
              </ButtonLink>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-md border border-blue-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-black text-brand-navy">Phone</h2>
                <a className="mt-2 inline-flex font-bold text-brand-blue" href={site.phoneHref}>
                  {site.phone}
                </a>
              </div>
              <div className="rounded-md border border-blue-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-black text-brand-navy">Email</h2>
                <a className="mt-2 inline-flex font-bold text-brand-blue" href={site.emailHref}>
                  {site.email}
                </a>
              </div>
              <div className="rounded-md border border-blue-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-black text-brand-navy">Service area</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{site.serviceArea}</p>
              </div>
              <div className="rounded-md border border-blue-100 bg-brand-sky p-5">
                <h2 className="font-display text-lg font-black text-brand-navy">
                  Emergency plumbing message
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  If water is actively leaking, a toilet is overflowing, or the issue feels unsafe, call Grade A Plumbing first so we can discuss the fastest available option.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl font-black text-brand-navy">Quote enquiry</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Share a few details and we will come back to you with the next step.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <CalendlyBookingSection className="py-20" />

      <WorkShowcase
        background="tint"
        description="Here are a few examples of recent hot water, bathroom, kitchen, toilet, and drainage jobs. If your plumbing issue is similar, include a photo in your enquiry so we can understand the work faster."
        eyebrow="Recent Melbourne plumbing work"
        limit={8}
        title="Recent plumbing work completed in Melbourne homes"
      />
    </>
  );
}
