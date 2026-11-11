import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingSection } from "@/components/CalendlyBookingSection";
import { getRequestLocation } from "@/lib/location-request";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Plumbing Appointment | Grade A Plumbing",
  description: "See available appointment times and book online with Grade A Plumbing. For urgent plumbing help, call (02) 5837 5457.",
  alternates: { canonical: `${site.baseUrl}/booking/` },
};

export default async function BookingPage() {
  await getRequestLocation();

  return (
    <main>
      <section className="bg-brand-navy px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-7xl sm:px-2 lg:px-4">
          <h1 className="font-display text-4xl font-bold uppercase sm:text-6xl">
            Book a plumbing appointment
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-blue-50">
            Choose an available time below. For urgent plumbing help, call{" "}
            <a className="font-semibold underline" href={site.phoneHref}>{site.phone}</a>.
            For pricing or help choosing a service,{" "}
            <Link className="font-semibold underline" href="/contact/#contact-form">request a quote</Link>.
          </p>
        </div>
      </section>
      <CalendlyBookingSection className="bg-brand-sky py-10 sm:py-16" />
    </main>
  );
}
