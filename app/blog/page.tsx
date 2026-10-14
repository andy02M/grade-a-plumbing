import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { publishedArticles } from "@/lib/articles";
import { getRequestLocation } from "@/lib/location-request";
import { site } from "@/lib/site";
import { QuoteForm } from "@/components/manus/components";
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Plumbing Advice | Grade A Plumbing",
    description:
      "Practical plumbing guides for Melbourne homes and businesses, with sources and clear next steps.",
    alternates: { canonical: site.baseUrl + "/blog/" },
  };
}
export default async function Blog() {
  const l = await getRequestLocation();
  if (l.slug !== "melbourne") permanentRedirect(site.baseUrl + "/blog/");
  return (
    <main>
      <section className="page-hero">
        <div className="container page-hero-inner">
          <span className="eyebrow">PLUMBING ADVICE</span>
          <h1>
            Practical answers.
            <br />
            Clear next steps.
          </h1>
          <p>
            Guides to help you understand plumbing questions and prepare for an
            assessment.
          </p>
        </div>
      </section>
      <section className="manus-advice">
        <div className="container manus-advice-grid">
          {publishedArticles.map((a) => (
            <article className="manus-advice-card" key={a.slug}>
              <span className="eyebrow">{a.publishedDate}</span>
              <h2>{a.title}</h2>
              <p>{a.excerpt}</p>
              <a href={"/blog/" + a.slug + "/"}>Read the guide →</a>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="container">
          <QuoteForm />
        </div>
      </section>
    </main>
  );
}
