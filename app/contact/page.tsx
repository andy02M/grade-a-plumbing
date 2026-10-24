import type { Metadata } from "next";
import ManusApp from "@/components/manus/App";
import { getRequestLocation } from "@/lib/location-request";
import { pageMetadata } from "@/lib/page-seo";
export async function generateMetadata(): Promise<Metadata> {
  const l = await getRequestLocation();
  return pageMetadata("Contact Grade A Plumbing " + l.location, `Request a plumbing quote in ${l.location} with your suburb, postcode and contact details. For urgent enquiries call (02) 5837 5457.`, l.website + "/contact/");
}
export default async function ContactPage() {
  const l = await getRequestLocation();
  return (
    <>
      <ManusApp initialPath="/contact/" embedded locationName={l.location} />
    </>
  );
}
