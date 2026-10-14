import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { articleBySlug, publishedArticles } from "@/lib/articles";
import { getRequestLocation } from "@/lib/location-request";
import { JsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { ArticleLayout } from "@/components/ArticleLayout";
export function generateStaticParams() {
  return publishedArticles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug.get(slug);
  if (!a) return {};
  const url = site.baseUrl + "/blog/" + slug + "/";
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: a.metaTitle,
      description: a.metaDescription,
      url,
      type: "article",
      publishedTime: a.publishedDate,
      modifiedTime: a.updatedDate ?? a.publishedDate,
    },
  };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articleBySlug.get(slug);
  if (!a) notFound();
  const l = await getRequestLocation();
  const url = site.baseUrl + "/blog/" + slug + "/";
  if (l.slug !== "melbourne") permanentRedirect(url);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.metaDescription,
          datePublished: a.publishedDate,
          dateModified: a.updatedDate ?? a.publishedDate,
          author: { "@type": "Organization", name: a.author },
          mainEntityOfPage: url,
        }}
      />
      <ArticleLayout article={a} publishedArticles={publishedArticles} />
    </>
  );
}
