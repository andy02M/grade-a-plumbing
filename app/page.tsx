import ManusApp from "@/components/manus/App";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { ContactForm } from "@/components/ContactForm";
import { CTASection } from "@/components/CTASection";
import { CustomerReviews } from "@/components/CustomerReviews";
import { Icon, type IconName } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { TrustBadge } from "@/components/TrustBadge";
import { WorkShowcase } from "@/components/WorkShowcase";
import { getRequestLocation } from "@/lib/location-request";
import { JsonLd } from "@/lib/seo";
import { services, serviceUrl } from "@/lib/seo-services";
import {
  brandAssets,
  processSteps,
  site,
  trustBadges,
  whyChooseUs,
} from "@/lib/site";
import { publicMapsUrl } from "@/lib/google-business-profiles";
import { localGuidance } from "@/lib/local-guidance";
import { pageMetadata } from "@/lib/page-seo";
import { locations } from "@/lib/locations";

const serviceIcons: Record<string, IconName> = {
  "blocked-drains": "drain",
  "sewer-repairs": "pipe",
  "pipe-relining": "wrench",
  "hot-water": "water",
  "emergency-plumber": "alert",
  "burst-pipe-repair": "pipe",
  "gas-plumbing": "flame",
  "commercial-plumbing": "building",
};

export async function generateMetadata(): Promise<Metadata> {
  const location = await getRequestLocation();
  const title =
    localGuidance[location.slug]?.title ??
    `Plumber ${location.location} | Local & Emergency Plumbing | Grade A Plumbing`;
  const description =
    localGuidance[location.slug]?.metaDescription ??
    `Need a local plumber in ${location.location}? Grade A Plumbing provides drain, hot water, emergency, gas and commercial plumbing services.`;
  return pageMetadata(title, description, `${location.website}/`);
}

export default async function HomePage() {
  const location = await getRequestLocation();
  const nearbyLocations = location.nearbySuburbs.flatMap(name => {
    const nearby = locations.find(item => item.location.toLowerCase() === name.toLowerCase());
    return nearby && nearby.slug !== location.slug ? [{name: nearby.location, url: nearby.website + "/"}] : [];
  }).slice(0, 6);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Plumber",
          "@id": location.website + "/#business",
          name: location.name,
          url: location.website,
          telephone: location.phone ?? site.phone,
          email: site.email,
          areaServed: {"@type": "Place", name: location.location + ", VIC, Australia"},
        }}
      />
      <JsonLd data={{"@context": "https://schema.org", "@type": "WebSite", "@id": location.website + "/#website", name: "Grade A Plumbing " + location.location, url: location.website + "/", inLanguage: "en-AU"}} />
      <ManusApp initialPath="/" embedded locationName={location.location} nearbyLocations={nearbyLocations} localPropertyGuidance={localGuidance[location.slug]} />
    </>
  );
}
