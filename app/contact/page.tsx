import type { Metadata } from "next";
import ManusApp from "@/components/manus/App";
import { getRequestLocation } from "@/lib/location-request";
export async function generateMetadata(): Promise<Metadata> {
  const l = await getRequestLocation();
  return {
    title: "Contact Grade A Plumbing " + l.location,
    description:
      "Request a plumbing quote with your suburb, postcode and preferred contact details.",
    alternates: { canonical: l.website + "/contact/" },
  };
}
export default function ContactPage() {
  return (
    <>
      <ManusApp initialPath="/contact/" embedded />
    </>
  );
}
