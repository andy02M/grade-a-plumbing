import { customerReviews } from "@/lib/customer-reviews";
import locationReviews from "@/data/location-reviews.json";

type ScrapedReview = { author: string; rating: number; date: string; text: string; sourceUrl: string };
type DisplayReview = { name: string; date: string; text?: string; detail?: string; excerpt?: boolean; rating?: number; sourceUrl?: string };

function Stars({ rating = 5 }: { rating?: number }) {
  const rounded = Math.max(1, Math.min(5, Math.round(rating)));
  return <span aria-label={`${rating} out of 5 stars`} className="text-lg tracking-[0.08em] text-amber-400">{"★".repeat(rounded)}<span className="text-slate-200">{"★".repeat(5 - rounded)}</span></span>;
}

export function CustomerReviews({ locationSlug }: { locationSlug?: string }) {
  const local = (locationReviews as Record<string, ScrapedReview[]>)[locationSlug ?? ""] ?? [];
  const reviews: DisplayReview[] = local.length
    ? local.map((review) => ({ name: review.author, date: review.date, text: review.text, rating: review.rating, sourceUrl: review.sourceUrl }))
    : customerReviews;
  return (
    <section aria-labelledby="customer-reviews-title" className="border-b border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-brand-blue">Customer feedback</p>
            <h2 id="customer-reviews-title" className="mt-2 font-sans text-3xl font-bold leading-tight tracking-[-0.025em] text-brand-navy sm:text-4xl">Reviews from our customers</h2>
          </div>
          <p className="font-sans text-sm leading-6 text-slate-500">Reviews supplied from the Grade A Plumbing Google Business Profile</p>
        </div>
        <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5" aria-label="Customer reviews">
          {reviews.map((review) => (
            <article className="min-w-[85%] snap-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:min-w-[22rem] lg:min-w-[24rem]" key={`${review.name}-${review.date}`}>
              <Stars rating={review.rating ?? 5} />
              {review.text ? <blockquote className="mt-4 leading-7 text-slate-700">“{review.text}”</blockquote> : <p className="mt-4 font-semibold text-slate-700">Five-star rating</p>}
              <footer className="mt-5 border-t border-slate-100 pt-4">
                <p className="font-black text-brand-navy">{review.name}</p>
                <p className="mt-1 text-xs text-slate-500">{review.date}{review.excerpt ? " · Review excerpt" : ""}</p>
                {review.detail ? <p className="mt-1 text-xs font-semibold text-slate-600">{review.detail}</p> : null}
                {review.sourceUrl ? <a className="mt-2 inline-block text-xs font-bold text-brand-blue hover:underline" href={review.sourceUrl} rel="noopener noreferrer">View on Google Maps</a> : null}
              </footer>
            </article>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Reviews are shown as short excerpts from Google. Select “View on Google Maps” where available to read the source review.</p>
      </div>
    </section>
  );
}
