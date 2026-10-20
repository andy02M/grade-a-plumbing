"use client";

import { useMemo, useState } from "react";
import type { Article } from "@/lib/articles";

type AdviceArticle = Pick<Article, "title" | "slug" | "publishedDate" | "updatedDate" | "excerpt" | "heroImage" | "heroImageAlt" | "relatedServices"> & { readingMinutes: number };

type Category = "Hot Water" | "Blocked Drains" | "Bathrooms" | "Kitchens" | "Toilets" | "Leak Detection" | "Pipe Repairs" | "General Tips";

const categories: Category[] = ["Hot Water", "Blocked Drains", "Bathrooms", "Kitchens", "Toilets", "Leak Detection", "Pipe Repairs", "General Tips"];
const fallbackImages: Record<Category, { card: string; alt: string }> = {
  "Hot Water": { card: "/images/plumbing-advice/cards/hot-water-cylinder-card.webp", alt: "Hot water cylinder and plumbing connections" },
  "Blocked Drains": { card: "/images/plumbing-advice/cards/blocked-drains-closeup-card.webp", alt: "Close-up view of a blocked drain" },
  Bathrooms: { card: "/images/plumbing-advice/cards/bathroom-inspection-card.webp", alt: "Bathroom plumbing inspection" },
  Kitchens: { card: "/images/plumbing-advice/cards/kitchen-plumbing-card.webp", alt: "Kitchen plumbing connections" },
  Toilets: { card: "/images/plumbing-advice/cards/toilet-repairs-card.webp", alt: "Toilet repair plumbing" },
  "Leak Detection": { card: "/images/plumbing-advice/cards/leak-detection-card.webp", alt: "Plumbing leak detection" },
  "Pipe Repairs": { card: "/images/plumbing-advice/cards/burst-copper-pipe-card.webp", alt: "Copper pipe repair" },
  "General Tips": { card: "/images/plumbing-advice/cards/plumber-at-door-card.webp", alt: "Plumber arriving for an assessment" },
};

function categoryFor(article: AdviceArticle): Category {
  const value = `${article.title} ${article.slug} ${article.relatedServices.join(" ")}`.toLowerCase();
  if (value.includes("hot-water") || value.includes("hot water")) return "Hot Water";
  if (value.includes("blocked") || value.includes("drain") || value.includes("sewer")) return "Blocked Drains";
  if (value.includes("bathroom") || value.includes("shower")) return "Bathrooms";
  if (value.includes("kitchen") || value.includes("dishwasher")) return "Kitchens";
  if (value.includes("toilet") || value.includes("cistern")) return "Toilets";
  if (value.includes("leak") || value.includes("water pressure") || value.includes("water bill")) return "Leak Detection";
  if (value.includes("pipe") || value.includes("plumbing repair") || value.includes("relining")) return "Pipe Repairs";
  return "General Tips";
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function imageFor(article: AdviceArticle, mode: "card" | "hero") {
  if (article.heroImage) return article.heroImage;
  const category = categoryFor(article);
  if (mode === "hero") {
    return fallbackImages[category].card.replace("/cards/", "/hero/").replace("-card.webp", "-hero.webp");
  }
  return fallbackImages[category].card;
}

function dispatchQuote() {
  window.dispatchEvent(new Event("open-quote"));
}

export function PlumbingAdvicePage({ articles }: { articles: AdviceArticle[] }) {
  const [activeCategory, setActiveCategory] = useState<"All Articles" | Category>("All Articles");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const sorted = useMemo(() => [...articles].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate) || a.slug.localeCompare(b.slug)), [articles]);
  const featured = sorted[0];
  const recommended = sorted.slice(1, 4);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter((article) => {
      const matchesCategory = activeCategory === "All Articles" || categoryFor(article) === activeCategory;
      const haystack = `${article.title} ${article.excerpt} ${article.slug} ${categoryFor(article)}`.toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [activeCategory, query, sorted]);
  const visible = filtered.slice(0, visibleCount);

  return (
    <main className="advice-page">
      <section className="advice-hero">
        <img className="advice-hero-image" src="/images/plumbing-advice/hero/hot-water-service-hero.webp" alt="Hot water service plumbing equipment" fetchPriority="high" />
        <div className="advice-hero-overlay" />
        <div className="container advice-hero-inner">
          <div className="advice-hero-copy">
            <span className="advice-kicker">GRADE A PLUMBING / ADVICE</span>
            <h1>PRACTICAL PLUMBING ADVICE FOR YOUR HOME.</h1>
            <p>Clear, useful guidance to help you understand plumbing issues, prepare for an assessment and make informed next steps.</p>
            <div className="advice-hero-actions">
              <button type="button" className="advice-primary-button" onClick={dispatchQuote}>Request a Quote <span>↗</span></button>
              <a className="advice-text-link" href="#advice-library">Browse the library <span>↓</span></a>
            </div>
          </div>
          <div className="advice-hero-note"><span>01</span><p>Practical information<br />for real plumbing questions.</p></div>
        </div>
      </section>

      <section className="advice-trust" aria-label="Advice benefits">
        <div className="container advice-trust-grid">
          <div><strong>01</strong><span>Clear explanations</span><small>No unnecessary jargon.</small></div>
          <div><strong>02</strong><span>Useful preparation</span><small>Know what to note before you call.</small></div>
          <div><strong>03</strong><span>Melbourne context</span><small>Guidance for local homes and businesses.</small></div>
        </div>
      </section>

      <section className="advice-library" id="advice-library">
        <div className="container">
          <div className="advice-section-heading"><div><span className="advice-kicker advice-kicker-dark">THE LIBRARY</span><h2>Advice you can act on.</h2></div><p>Browse published plumbing guides from Grade A Plumbing. Choose a topic or search the library to find a useful starting point.</p></div>
          <div className="advice-toolbar">
            <div className="advice-chips" role="group" aria-label="Filter articles by category">
              {(["All Articles", ...categories] as const).map((category) => <button key={category} type="button" className={activeCategory === category ? "is-active" : ""} aria-pressed={activeCategory === category} onClick={() => { setActiveCategory(category); setVisibleCount(6); }}>{category}</button>)}
            </div>
            <label className="advice-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(6); }} placeholder="Search advice" aria-label="Search advice" /></label>
          </div>

          {featured && <article className="advice-featured">
            <a href={`/blog/${featured.slug}/`} className="advice-featured-image"><img src={imageFor(featured, "hero")} alt={featured.heroImageAlt ?? `${categoryFor(featured)} article image`} /></a>
            <div className="advice-featured-copy"><span className="advice-card-category">FEATURED / {categoryFor(featured)}</span><h3><a href={`/blog/${featured.slug}/`}>{featured.title}</a></h3><p>{featured.excerpt}</p><div className="advice-card-meta"><time dateTime={featured.publishedDate}>{displayDate(featured.publishedDate)}</time><span>{featured.readingMinutes} min read</span></div><a className="advice-arrow-link" href={`/blog/${featured.slug}/`}>Read the guide <span>↗</span></a></div>
          </article>}

          <div className="advice-content-layout">
            <div className="advice-results"><div className="advice-results-heading"><h3>{query || activeCategory !== "All Articles" ? "Matching advice" : "Latest advice"}</h3><span>{filtered.length} {filtered.length === 1 ? "article" : "articles"}</span></div>
              <div className="advice-card-grid">{visible.map((article) => <article className="advice-card" key={article.slug}><a href={`/blog/${article.slug}/`} className="advice-card-image"><img src={imageFor(article, "card")} alt={article.heroImageAlt ?? `${categoryFor(article)} article image`} loading="lazy" /></a><div className="advice-card-body"><span className="advice-card-category">{categoryFor(article)}</span><h3><a href={`/blog/${article.slug}/`}>{article.title}</a></h3><p>{article.excerpt}</p><div className="advice-card-meta"><time dateTime={article.publishedDate}>{displayDate(article.publishedDate)}</time><span>{article.readingMinutes} min read</span></div></div></article>)}</div>
              {visible.length < filtered.length && <button className="advice-load-more" type="button" onClick={() => setVisibleCount((count) => count + 6)}>Load more articles <span>＋</span></button>}
              {filtered.length === 0 && <p className="advice-empty">No published articles match that search. Try another topic or phrase.</p>}
            </div>
            <aside className="advice-sidebar"><div className="advice-sidebar-block"><span className="advice-kicker advice-kicker-dark">START HERE</span><h3>Recommended articles</h3><p>Useful next reads selected from the latest published advice.</p><div className="advice-recommended-list">{recommended.map((article, index) => <a href={`/blog/${article.slug}/`} key={article.slug}><strong>0{index + 1}</strong><span><b>{article.title}</b><small>{categoryFor(article)} · {article.readingMinutes} min read</small></span><i>↗</i></a>)}</div></div><div className="advice-sidebar-cta"><span className="advice-kicker">NEED A PLUMBER?</span><h3>Advice is a good start. A clear assessment is next.</h3><button type="button" onClick={dispatchQuote}>Request a Quote <span>↗</span></button></div></aside>
          </div>
        </div>
      </section>

      <section className="advice-cta"><div className="container advice-cta-inner"><div><span className="advice-kicker">WHEN YOU NEED A CLEAR NEXT STEP</span><h2>Let’s talk through the problem.</h2><p>Share what you know and our existing quote request team will help you take the next step.</p></div><button type="button" className="advice-light-button" onClick={dispatchQuote}>Request a Quote <span>↗</span></button></div></section>
    </main>
  );
}
