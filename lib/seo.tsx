import type { Metadata } from "next";
import { primarySeoAreas, site, type BreadcrumbItem, type FaqItem } from "./site";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) {
    return path;
  }

  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${site.baseUrl}${normalisedPath}`;
}

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function createMetadata({
  title,
  description,
  path,
  keywords = []
}: MetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: "en_AU",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Plumber"],
    name: site.name,
    url: site.baseUrl,
    telephone: site.phone,
    email: site.email,
    description: site.description,
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Melbourne VIC"
      },
      ...primarySeoAreas.map((area) => ({
        "@type": "Place",
        name: `${area} VIC`
      })),
      {
        "@type": "State",
        name: "Victoria"
      }
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Melbourne",
      addressRegion: "VIC",
      addressCountry: "AU"
    },
    priceRange: "$$"
  };
}

export function serviceSchema({
  name,
  description,
  path,
  serviceType
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    url: absoluteUrl(path),
    provider: {
      "@type": ["LocalBusiness", "Plumber"],
      name: site.name,
      telephone: site.phone,
      url: site.baseUrl
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Melbourne VIC"
      },
      ...primarySeoAreas.map((area) => ({
        "@type": "Place",
        name: `${area} VIC`
      }))
    ]
  };
}

export function faqSchema(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function breadcrumbSchema(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href)
    }))
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c")
      }}
    />
  );
}
