import suppliedReviews from '@/data/supplied-customer-reviews.json';

export type CustomerReview = { name: string; rating: number; text?: string; date: string };

// Review ages confirmed by the owner on 25 October 2026, in supplied order.
// Keep the reference date visible: these are not rolling "always recent" dates
// or precise publication timestamps. No aggregate-rating schema is added.
export const reviewDateReference = '25 October 2026';
export const customerReviews: CustomerReview[] = suppliedReviews.map((review,index) => ({
  ...review,
  date: index < 50 ? '2 months ago' : index < 100 ? '1 month ago' : index < 150 ? '3 weeks ago' : '1 week ago',
}));
