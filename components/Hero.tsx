import type { ReactNode } from "react";
import { brandAssets, site } from "@/lib/site";
import { ButtonLink } from "./ButtonLink";
import { Icon } from "./Icon";

type HeroProps = {
  badge: string;
  title: string;
  text: string;
  children?: ReactNode;
};

export function Hero({ badge, title, text, children }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${brandAssets.serviceVan.src}')` }}
        aria-hidden="true"
      />
      <div className="hero-mesh absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,33,63,0.15),rgba(8,33,63,0.78))]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-blue-50 shadow-sm backdrop-blur">
            {badge}
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.96] tracking-normal text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">{text}</p>
          <div className="mt-8 grid gap-3 sm:flex">
            <ButtonLink className="gap-2" href={site.phoneHref}>
              <Icon name="phone" className="h-4 w-4" />
              Call Now
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Request a Free Quote
            </ButtonLink>
          </div>
        </div>
        {children ? <div>{children}</div> : null}
      </div>
    </section>
  );
}
