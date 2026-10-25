import { customerReviews } from '@/lib/customer-reviews';

export function CustomerReviews({ locationSlug: _locationSlug }: { locationSlug?: string }) {
  return (
    <section aria-labelledby="customer-reviews-title" className="border-b border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-brand-blue">Customer feedback</p>
        <h2 id="customer-reviews-title" className="mt-2 font-sans text-3xl font-bold leading-tight tracking-[-0.025em] text-brand-navy sm:text-4xl">Reviews from our customers</h2>
        <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5" aria-label="Customer reviews">
          {customerReviews.map((review,index) => (
            <article className="min-w-[85%] snap-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:min-w-[22rem] lg:min-w-[24rem]" key={review.name+'-'+index}>
              <span aria-label="5 out of 5 stars" className="text-lg tracking-[0.08em] text-amber-400"><span aria-hidden="true">★★★★★</span></span>
              {review.text ? <blockquote className="mt-4 whitespace-pre-line leading-7 text-slate-700">{review.text}</blockquote> : null}
              <footer className="mt-5 border-t border-slate-100 pt-4"><p className="font-black text-brand-navy">{review.name}</p></footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
