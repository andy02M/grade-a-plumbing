import { ServicePageContent } from "@/lib/service-pages";
import { site, trustBadges, whyChooseUs } from "@/lib/site";
import { Breadcrumbs } from "./Breadcrumbs";
import { ButtonLink } from "./ButtonLink";
import { CTASection } from "./CTASection";
import { FAQ } from "./FAQ";
import { Hero } from "./Hero";
import { Icon } from "./Icon";
import { ServiceAreaGrid } from "./ServiceAreaGrid";
import { TrustBadge } from "./TrustBadge";

export function ServicePage({ content }: { content: ServicePageContent }) {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: content.breadcrumb, href: content.slug }
        ]}
      />
      <Hero badge={content.heroBadge} text={content.heroText} title={content.heroTitle}>
        <div className="rounded-md border border-white/12 bg-[#111a29]/72 p-6 shadow-[0_30px_70px_rgba(3,10,20,0.35)] backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand-blue">
              <Icon name="phone" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">
                Speak with a Melbourne plumber
              </h2>
              <p className="mt-3 text-sm leading-7 text-blue-50/80">
                Tell us what is happening, your suburb, and whether the issue is urgent. We regularly service Melbourne CBD, St Kilda, South Melbourne, and Richmond.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:flex">
            <ButtonLink className="gap-2" href={site.phoneHref}>
              <Icon name="phone" className="h-4 w-4" />
              {site.phone}
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Request Quote
            </ButtonLink>
          </div>
        </div>
      </Hero>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              Melbourne and inner-suburb plumbing service
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              {content.introTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">{content.introText}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustBadges.map((badge) => (
              <TrustBadge key={badge} label={badge} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-mist py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              Problems we help with
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              {content.problemTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {content.problems.map((item) => (
              <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={item.title}>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-sky text-brand-blue">
                  <Icon name="wrench" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-black text-brand-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              How we help
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              {content.helpTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">{content.helpText}</p>
          </div>
          <div className="grid gap-4">
            {content.helpItems.map((item) => (
              <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={item.title}>
                <h3 className="font-display text-lg font-black text-brand-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-navy py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-100">
              Service areas
            </p>
            <h2 className="mt-3 font-display text-3xl font-black">Melbourne VIC and surrounding suburbs</h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              We service Melbourne CBD, St Kilda, South Melbourne, Richmond, and surrounding inner, north, west, east, and south east Melbourne. If your suburb is not listed, contact us to check availability.
            </p>
          </div>
          <div className="rounded-md bg-white/10 p-4">
            <ServiceAreaGrid compact />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              Why choose us
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              Clear plumbing support from first call to clean up
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {whyChooseUs.map((item) => (
              <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={item}>
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-sky text-brand-blue">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <p className="font-semibold text-brand-charcoal">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-mist py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-blue">
              Questions
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-normal text-brand-navy sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <FAQ items={content.faq} />
        </div>
      </section>

      <CTASection text={content.ctaText} title={content.ctaTitle} />
    </>
  );
}
