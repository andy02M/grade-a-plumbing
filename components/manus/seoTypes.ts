export type SeoSectionKind = 'prose' | 'bullets' | 'steps' | 'table' | 'callout' | 'links'

export type SeoStep = { title: string; body: string }
export type SeoLink = { label: string; route: string; description?: string }

export type SeoSection = {
  kind: SeoSectionKind
  heading: string
  intro?: string
  paragraphs?: string[]
  items?: string[]
  steps?: SeoStep[]
  columns?: string[]
  rows?: string[][]
  links?: SeoLink[]
  note?: string
  tone?: 'info' | 'warning' | 'safety'
}

export type SeoFaq = { question: string; answer: string }
export type SeoPricingFactor = { factor: string; explanation: string }
export type SeoRelatedService = { label: string; route: string; why?: string }
export type SeoSource = { title: string; url: string }

export type ServiceSeo = {
  slug: string
  seoTitle: string
  metaDescription: string
  heroEyebrow: string
  heroLead: string
  heroHighlight: string
  heroDescription: string
  intro: string[]
  sections: SeoSection[]
  faqs: SeoFaq[]
  pricingFactors: SeoPricingFactor[]
  relatedServices: SeoRelatedService[]
  sources: SeoSource[]
  bodyWordCount?: number
}

/** Count the readable body words of a service content package (intro + sections). */
export function countServiceBodyWords(content: ServiceSeo): number {
  const parts: string[] = [...content.intro]
  for (const section of content.sections) {
    parts.push(section.heading)
    if (section.intro) parts.push(section.intro)
    if (section.note) parts.push(section.note)
    if (section.paragraphs) parts.push(...section.paragraphs)
    if (section.items) parts.push(...section.items)
    if (section.steps) parts.push(...section.steps.flatMap(step => [step.title, step.body]))
    if (section.columns) parts.push(...section.columns)
    if (section.rows) parts.push(...section.rows.flat())
    if (section.links) parts.push(...section.links.flatMap(link => [link.label, link.description ?? '']))
  }
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}
