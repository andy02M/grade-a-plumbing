export const editorialOrigin = 'https://melbourne.gradeaplumbing.store';
export const sharedCorporatePaths = new Set(['/about/','/reviews/','/our-work/','/service-areas/']);
export function pageCanonical(origin: string, path: string) {
  return new URL(path, sharedCorporatePaths.has(path) ? editorialOrigin : origin).href;
}
