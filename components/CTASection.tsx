import { site } from "@/lib/site";
import { ButtonLink } from "./ButtonLink";
import { Icon } from "./Icon";

type CTASectionProps = {
  title: string;
  text: string;
};

export function CTASection({ title, text }: CTASectionProps) {
  return (
    <section className="relative overflow-hidden bg-brand-navy py-20 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/plumbing-hero-scene.svg')" }}
        aria-hidden="true"
      />
      <div className="hero-mesh absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">
            Grade A Plumbing Melbourne
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-normal sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50">{text}</p>
        </div>
        <div className="grid gap-3 sm:flex lg:justify-end">
          <ButtonLink className="gap-2" href={site.phoneHref} variant="light">
            <Icon name="phone" className="h-4 w-4" />
            Call Now
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Request a Free Quote
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
