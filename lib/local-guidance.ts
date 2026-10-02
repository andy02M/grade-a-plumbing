import records from "@/data/local-guidance.json";
import priorityCopy from "@/data/priority-location-copy.json";
import { remainingLocalGuidance } from "./remaining-local-guidance";

export type LocalGuidance = {
  title?: string;
  introduction?: string;
  metaDescription?: string;
  heading: string;
  checkedDate: string;
  contentUpdatedDate?: string;
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

// Search Console priorities: improve booking intent without replacing local evidence.
for (const [slug, copy] of Object.entries(priorityCopy)) {
  const existing = localGuidance[slug];
  if (!existing) throw new Error(`Unknown priority location: ${slug}`);
  localGuidance[slug] = {
    ...existing,
    title: copy.title,
    introduction: copy.introduction,
    metaDescription: copy.metaDescription,
    contentUpdatedDate: "2026-10-02",
    paragraphs: [...existing.paragraphs, copy.bookingGuidance],
    faqs: [...existing.faqs, { question: copy.question, answer: copy.answer }],
    relatedServices: copy.relatedServices,
  };
}
