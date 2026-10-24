import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { publishedArticles } from "@/lib/articles";
import { getRequestLocation } from "@/lib/location-request";
import { site } from "@/lib/site";
import { PlumbingAdvicePage } from "@/components/PlumbingAdvicePage";
import { pageMetadata, pageBreadcrumbs } from "@/lib/page-seo";
import { JsonLd } from "@/lib/seo";
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("Plumbing Advice | Grade A Plumbing", "Practical plumbing guides for Melbourne homes and businesses, with sources and clear next steps.", site.baseUrl + "/blog/");
}
export default async function Blog() {
  const l = await getRequestLocation();
  if (l.slug !== "melbourne") permanentRedirect(site.baseUrl + "/blog/");
  const adviceArticles = publishedArticles.map((article) => ({
    title: article.title,
    slug: article.slug,
    publishedDate: article.publishedDate,
    updatedDate: article.updatedDate,
    excerpt: article.excerpt,
    heroImage: article.heroImage,
    heroImageAlt: article.heroImageAlt,
    relatedServices: article.relatedServices,
    readingMinutes: Math.max(
      2,
      Math.ceil(
        article.sections.reduce(
          (words, section) =>
            words + section.heading.split(/\s+/).length + section.paragraphs.join(" ").split(/\s+/).length,
          0,
        ) / 220,
      ),
    ),
  }));
  return <>
    <JsonLd data={{"@context": "https://schema.org", "@type": "CollectionPage", name: "Plumbing Advice", url: site.baseUrl + "/blog/", inLanguage: "en-AU"}} />
    <JsonLd data={pageBreadcrumbs(site.baseUrl, [{name: "Home", path: "/"}, {name: "Advice", path: "/blog/"}])} />
    <PlumbingAdvicePage articles={adviceArticles} />
  </>;
}
