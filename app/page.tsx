import ManusApp from "@/components/manus/App";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { ContactForm } from "@/components/ContactForm";
import { CTASection } from "@/components/CTASection";
import { CustomerReviews } from "@/components/CustomerReviews";
import { FAQ } from "@/components/FAQ";
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
  return {
    title,
    description,
    alternates: { canonical: `${location.website}/` },
    openGraph: {
      title,
      description,
      url: `${location.website}/`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  const location = await getRequestLocation();
  const address = location.address
    ? { "@type": "PostalAddress", ...location.address }
    : undefined;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Plumber",
          name: location.name,
          url: location.website,
          telephone: location.phone ?? site.phone,
          ...(address ? { address } : {}),
        }}
      />
      <ManusApp initialPath="/" embedded />
    </>
  );
}
