"use client";

export function ArticleQuoteButton({ label = "Request a Quote" }: { label?: string }) {
  return (
    <button className="article-reading-button" type="button" onClick={() => window.dispatchEvent(new Event("open-quote"))}>
      {label} <span aria-hidden="true">↗</span>
    </button>
  );
}
