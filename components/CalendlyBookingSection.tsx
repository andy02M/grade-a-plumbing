"use client";

import Script from "next/script";
import { ButtonLink } from "@/components/ButtonLink";
import { Icon } from "@/components/Icon";
import { site } from "@/lib/site";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

type CalendlyBookingSectionProps = {
  className?: string;
};

export function CalendlyBookingSection({ className = "" }: CalendlyBookingSectionProps) {
  return (
    <section className={className} id="book-appointment">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">
              Book an appointment
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              Pick a time that suits you
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              Prefer to lock in a time instead of waiting on a callback? Use the booking calendar below to schedule a plumbing appointment with Grade A Plumbing.
            </p>

            <div className="glass-surface mt-6 rounded-[1.5rem] p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-blue text-white">
                  <Icon className="h-5 w-5" name="clock" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase leading-none text-brand-navy">
                    Fast online booking
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    If you would rather open Calendly in a full page, you can also book directly using the button below.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink
                  className="gap-2"
                  href={site.calendlyUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon className="h-4 w-4" name="clock" />
                  Open Booking Page
                </ButtonLink>
                <ButtonLink href={site.phoneHref} variant="secondary">
                  Call Instead
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
            <div
              className="calendly-inline-widget min-w-[320px]"
              data-resize="true"
              data-url={site.calendlyEmbedUrl}
              style={{ height: "760px" }}
            />
          </div>
        </div>
      </div>

      <Script
        async
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
