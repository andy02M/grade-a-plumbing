import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { site } from "@/lib/site";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <section className="bg-brand-mist py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-brand-blue text-white">
          <Icon name="pipe" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-black text-brand-navy">Page not found</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          This page is not available. You can return home, call Grade A Plumbing, or request a quote.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:justify-center">
          <ButtonLink href="/">Back Home</ButtonLink>
          <ButtonLink className="gap-2" href={site.phoneHref} variant="secondary">
            <Icon name="phone" className="h-4 w-4" />
            Call Now
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Looking for service areas?{" "}
          <Link className="font-bold text-brand-blue" href="/service-areas">
            View Melbourne suburbs
          </Link>
        </p>
      </div>
    </section>
  );
}
