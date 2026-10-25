import suppliedReviews from '@/data/supplied-customer-reviews.json';

export type CustomerReview = { name: string; rating: number; text?: string };

// Owner-supplied five-star feedback. No inferred dates, location assignments or
// aggregate-rating structured data. Missing testimonials remain rating-only.
export const customerReviews: CustomerReview[] = suppliedReviews;
