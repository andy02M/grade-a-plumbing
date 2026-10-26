export const reviewsPerPage = 12;
export function reviewPageNumber(value: string | string[] | undefined, count: number) {
  const raw=Array.isArray(value)?value[0]:value;
  const page=raw && /^\d+$/.test(raw) ? Number(raw) : 1;
  return Math.min(Math.max(1,page),Math.max(1,Math.ceil(count/reviewsPerPage)));
}
export function reviewPagePath(page: number) {return page>1 ? `/reviews/?page=${page}` : '/reviews/';}
