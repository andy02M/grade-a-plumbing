import records from "@/data/local-guidance.json";
import { remainingLocalGuidance } from "./remaining-local-guidance";

export type LocalGuidance = {
  introduction?: string;
  metaDescription?: string;
  heading: string;
  checkedDate: string;
  paragraphs: string[];
  faqs: { question: string; answer: string }[];
  relatedServices: string[];
  sources: { title: string; url: string }[];
};

// Local authority guidance does not verify a Grade A Plumbing storefront.
for (const slug of Object.keys(remainingLocalGuidance)) {
  if (slug in records) throw new Error(`Local guidance overlap: ${slug}`);
}
export const localGuidance: Record<string, LocalGuidance> = { ...records, ...remainingLocalGuidance };
