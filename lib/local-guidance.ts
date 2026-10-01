import records from "@/data/local-guidance.json";

export type LocalGuidance = {
  heading: string;
  checkedDate: string;
  paragraphs: string[];
  faqs: { question: string; answer: string }[];
  relatedServices: string[];
  sources: { title: string; url: string }[];
};

// Local authority guidance does not verify a Grade A Plumbing storefront.
export const localGuidance: Record<string, LocalGuidance> = records;
