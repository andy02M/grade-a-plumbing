import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/articles";
import { serviceBySlug, serviceUrl } from "@/lib/seo-services";
import { getLocationBySlug } from "@/lib/locations";
import { site } from "@/lib/site";
import { ArticleQuoteButton } from "@/components/ArticleQuoteButton";

type ArticleLayoutProps = { article: Article; publishedArticles: Article[] };

type TopicMedia = { key: string; hero: string; inline: string; label: string; alt: string };

const topicMedia: TopicMedia[] = [
  { key: "hot-water", hero: "hot-water-service", inline: "hot-water-service", label: "HOT WATER", alt: "Hot water service equipment" },
  { key: "blocked-drain", hero: "drain-inspection", inline: "drain-inspection", label: "BLOCKED DRAINS", alt: "Drain inspection equipment" },
  { key: "toilet", hero: "toilet-repairs", inline: "toilet-repairs", label: "TOILET REPAIRS", alt: "Toilet repair scene" },
  { key: "burst", hero: "burst-copper-pipe", inline: "burst-copper-pipe", label: "EMERGENCY PLUMBING", alt: "Burst copper pipe" },
  { key: "gas", hero: "gas-plumbing", inline: "gas-plumbing", label: "GAS PLUMBING", alt: "Gas plumbing equipment" },
  { key: "sewer", hero: "sewer-pipe-lining", inline: "sewer-pipe-lining", label: "SEWER REPAIRS", alt: "Sewer pipe lining work" },
  { key: "bathroom", hero: "bathroom-shower", inline: "bathroom-shower", label: "BATHROOM PLUMBING", alt: "Bathroom plumbing" },
  { key: "kitchen", hero: "kitchen-plumbing", inline: "kitchen-plumbing", label: "KITCHEN PLUMBING", alt: "Kitchen plumbing" },
  { key: "leak", hero: "leak-detection", inline: "leak-detection", label: "LEAK DETECTION", alt: "Leak detection equipment" },
];

function selectTopic(article: Article): TopicMedia {
  const text = `${article.title} ${article.slug} ${article.relatedServices.join(" ")}`.toLowerCase();
  if (text.includes("sewer") || text.includes("relining")) return topicMedia.find((m) => m.key === "sewer")!;
  if (text.includes("blocked") || text.includes("drain")) return topicMedia.find((m) => m.key === "blocked-drain")!;
  if (text.includes("toilet") || text.includes("cistern")) return topicMedia.find((m) => m.key === "toilet")!;
  if (text.includes("burst") || text.includes("emergency")) return topicMedia.find((m) => m.key === "burst")!;
  if (text.includes("gas")) return topicMedia.find((m) => m.key === "gas")!;
  if (text.includes("kitchen") || text.includes("tap") || text.includes("sink")) return topicMedia.find((m) => m.key === "kitchen")!;
  if (text.includes("leak")) return topicMedia.find((m) => m.key === "leak")!;
  if (text.includes("bathroom") || text.includes("shower")) return topicMedia.find((m) => m.key === "bathroom")!;
  return topicMedia.find((m) => m.key === "hot-water")!;
}

function readingMinutes(article: Article) {
  const words = article.sections.reduce((total, section) => total + section.heading.split(/\s+/).length + section.paragraphs.join(" ").split(/\s+/).length, 0);
  return Math.max(3, Math.ceil(words / 220));
}

function anchorFor(heading: string, index: number) {
  const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `section-${index}-${slug || "content"}`;
}

function categoryLabel(article: Article, media: TopicMedia) {
  const service = article.relatedServices[0] ? serviceBySlug.get(article.relatedServices[0])?.label : undefined;
  return service ? service.toUpperCase() : media.label;
}

export function ArticleLayout({ article, publishedArticles }: ArticleLayoutProps) {
  const media = selectTopic(article);
  const category = categoryLabel(article, media);
  const heroSrc = article.heroImage || `/images/plumbing-advice/hero/${media.hero}-hero.webp`;
  const heroAlt = article.heroImageAlt || media.alt;
  const minutes = readingMinutes(article);
  const sections = article.sections.map((section, index) => ({ ...section, id: anchorFor(section.heading, index) }));
  const related = article.relatedArticles.map((slug) => publishedArticles.find((candidate) => candidate.slug === slug)).filter((candidate): candidate is Article => Boolean(candidate));
  const fallbackRelated = publishedArticles.filter((candidate) => candidate.slug !== article.slug && !related.some((item) => item.slug === candidate.slug)).slice(0, Math.max(0, 3 - related.length));
  const relatedArticles = [...related, ...fallbackRelated].slice(0, 3);
  const relatedServices = article.relatedServices.map((slug) => serviceBySlug.get(slug)).filter(Boolean).slice(0, 4);
  const locations = (article.locationSlugs || []).map((slug) => getLocationBySlug(slug)).filter(Boolean);
  const firstParagraph = article.sections[0]?.paragraphs[0];

  return (
    <main className="article-reading">
      <section className="article-reading-hero">
        <Image className="article-reading-hero-image" src={heroSrc} alt={heroAlt} fill priority sizes="100vw" />
        <div className="article-reading-hero-overlay" />
        <div className="article-reading-wrap article-reading-hero-content">
          <div className="article-reading-eyebrow"><Link href="/blog/">PLUMBING ADVICE</Link><span>/</span>{category}</div>
          <div className="article-reading-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog/">Advice</Link><span>/</span><span>{category}</span></div>
          <h1>{article.title}</h1>
          <p className="article-reading-deck">{article.excerpt}</p>
          <div className="article-reading-meta"><span>{article.author}</span><span>Published <time dateTime={article.publishedDate}>{article.publishedDate}</time></span>{article.updatedDate && <span>Updated <time dateTime={article.updatedDate}>{article.updatedDate}</time></span>}<span>{minutes} min read</span></div>
        </div>
      </section>

      <div className="article-reading-wrap article-reading-content-grid">
        <article className="article-reading-article">
          <details className="article-reading-mobile-toc">
            <summary>JUMP TO SECTION</summary>
            <div>{sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.heading}</a>)}</div>
          </details>
          <div className="article-reading-quick"><span>AT A GLANCE</span><p>{firstParagraph || article.excerpt}</p></div>
          {sections.map((section, index) => (
            <section className="article-reading-section" id={section.id} key={section.id}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {index === 0 && <figure className="article-reading-figure"><Image src={`/images/plumbing-advice/inline/${media.inline}-inline.webp`} alt={media.alt} width={1200} height={675} sizes="(max-width: 900px) 100vw, 800px" /></figure>}
              {section.sourceUrls && section.sourceUrls.length > 0 && <div className="article-reading-source-links"><strong>Supporting links</strong>{section.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">Open supporting source</a>)}</div>}
            </section>
          ))}

          {article.faq.length > 0 && <section className="article-reading-section article-reading-faq" id="questions"><h2>Frequently asked questions</h2>{article.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>}
          {article.sources && article.sources.length > 0 && <section className="article-reading-section article-reading-sources" id="sources"><h2>Sources and further reading</h2><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>{source.checkedDate && <span> · Checked {source.checkedDate}</span>}</li>)}</ul></section>}
        </article>

        <aside className="article-reading-aside">
          <div className="article-reading-sticky">
            <nav className="article-reading-sidebox article-reading-toc" aria-label="On this page"><h2>ON THIS PAGE</h2>{sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.heading}</a>)}{article.faq.length > 0 && <a href="#questions">Frequently asked questions</a>}{article.sources && article.sources.length > 0 && <a href="#sources">Sources and further reading</a>}</nav>
            <div className="article-reading-sidebox article-reading-cta"><span>NEED A PLUMBER?</span><h2>ADVICE IS A GOOD START.<br />A CLEAR ASSESSMENT COMES NEXT.</h2><p>Share the details of your plumbing issue with the existing Grade A Plumbing quote team.</p><ArticleQuoteButton label="Request a Quote" /></div>
            {relatedServices.length > 0 && <div className="article-reading-sidebox"><h2>RELATED SERVICES</h2>{relatedServices.map((service) => <Link key={service!.slug} href={serviceUrl(service!.slug)}>{service!.label}</Link>)}</div>}
          </div>
        </aside>
      </div>

      {article.relatedServices.length > 0 && locations.length > 0 && <section className="article-reading-service-strip"><div className="article-reading-wrap"><span>PLAN THE NEXT STEP</span><h2>Need help with a plumbing question?</h2><p>Use the existing quote request system to share your article topic, symptoms and location.</p><ArticleQuoteButton label="Request a Quote" /></div></section>}
      {relatedArticles.length > 0 && <section className="article-reading-related"><div className="article-reading-wrap"><span className="article-reading-eyebrow article-reading-eyebrow-dark">MORE HELPFUL PLUMBING ADVICE</span><h2>Continue reading.</h2><div className="article-reading-related-grid">{relatedArticles.map((relatedArticle) => { const relatedMedia = selectTopic(relatedArticle); return <Link className="article-reading-related-card" href={`/blog/${relatedArticle.slug}/`} key={relatedArticle.slug}><Image src={relatedArticle.heroImage || `/images/plumbing-advice/cards/${relatedMedia.hero}-card.webp`} alt={relatedArticle.heroImageAlt || relatedMedia.alt} width={640} height={360} sizes="(max-width: 760px) 100vw, 33vw" /><div><span>{categoryLabel(relatedArticle, relatedMedia)}</span><h3>{relatedArticle.title}</h3><p>{relatedArticle.excerpt}</p><strong>Read article →</strong></div></Link>; })}</div></div></section>}
    </main>
  );
}
