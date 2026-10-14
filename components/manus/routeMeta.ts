import { PHONE, EMAIL, PHONE_LINK } from './data'
import { serviceDetails, serviceList } from './marketingData'
import { normalizePageRoute } from './routes'
import { seoContent, serviceSeoFor } from './seoContent'

export const SITE_ORIGIN = 'https://gradeaplumbing.store'
export const OG_IMAGE = `${SITE_ORIGIN}/assets/grade-a/hero-plumber-under-sink.webp`
export const BUSINESS_NAME = 'Grade A Plumbing'

export type Crumb = { label: string; href?: string }

export type RouteMeta = {
  title: string
  description: string
  canonical: string
  robots: string
  breadcrumbs: Crumb[]
  jsonLd: Record<string, unknown>[]
}

const staticPages: Record<string, { title: string; description: string; crumbs: Crumb[] }> = {
  '/': {
    title: 'Grade A Plumbing | Melbourne Plumber',
    description: 'Grade A Plumbing provides clear, practical plumbing help across Melbourne, day or night. Call (02) 5837 5457.',
    crumbs: [{ label: 'Home' }],
  },
  '/services/': {
    title: 'Plumbing Services Melbourne | Grade A Plumbing',
    description: 'Explore Grade A Plumbing services across Melbourne, from emergency plumbing and blocked drains to hot water systems, leak detection and commercial plumbing.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Services' }],
  },
  '/our-work/': {
    title: 'Plumbing Image References | Grade A Plumbing',
    description: 'Illustrative plumbing service imagery supplied with the Grade A Plumbing website. These concept images are not photographs of completed Grade A Plumbing jobs.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Our Work' }],
  },
  '/about/': {
    title: 'About Grade A Plumbing | Melbourne Plumber',
    description: 'How Grade A Plumbing approaches Melbourne plumbing work: clear communication, careful work and a practical next step for homes, businesses and managed properties.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About' }],
  },
  '/service-areas/': {
    title: 'Service Areas | Melbourne Plumbing | Grade A Plumbing',
    description: 'Search the Greater Melbourne locality list and the confirmed Sydney locations for Grade A Plumbing, with coverage status shown separately from geographic inclusion.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Service Areas' }],
  },
  '/contact/': {
    title: 'Contact Grade A Plumbing | Melbourne Plumber',
    description: `Request plumbing help across Melbourne. Call ${PHONE}, email ${EMAIL} or send your suburb and issue through the quote enquiry form.`,
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Contact' }],
  },
  '/reviews/': {
    title: 'Customer Feedback | Grade A Plumbing',
    description: 'How Grade A Plumbing handles customer feedback, and why only authenticated customer reviews with a verifiable source are published on this site.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Reviews' }],
  },
}

function businessNode() {
  return {
    '@type': 'Plumber',
    name: BUSINESS_NAME,
    url: `${SITE_ORIGIN}/`,
    telephone: '+61258375457',
    email: EMAIL,
    areaServed: [
      { '@type': 'City', name: 'Melbourne' },
      { '@type': 'State', name: 'Victoria' },
    ],
  }
}

function breadcrumbNode(crumbs: Crumb[], canonical: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: crumb.href ? `${SITE_ORIGIN}${crumb.href}` : canonical,
    })),
  }
}

export function getRouteMeta(inputPath: string): RouteMeta {
  const path = normalizePageRoute(inputPath)
  const canonical = `${SITE_ORIGIN}${path}`
  const known = staticPages[path]

  if (known) {
    return {
      title: known.title,
      description: known.description,
      canonical,
      robots: 'index,follow',
      breadcrumbs: known.crumbs,
      jsonLd: [breadcrumbNode(known.crumbs, canonical)],
    }
  }

  const service = serviceList.find(item => item.route === path)
  const content = service ? serviceSeoFor(service.slug) : undefined
  const detail = service ? serviceDetails[service.slug] : undefined

  if (service && content && detail) {
    const crumbs: Crumb[] = [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services/' },
      { label: service.title },
    ]
    const jsonLd: Record<string, unknown>[] = [
      breadcrumbNode(crumbs, canonical),
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: content.seoTitle.replace(/\s*\|\s*Grade A Plumbing$/, ''),
        serviceType: service.title,
        description: content.metaDescription,
        url: canonical,
        provider: businessNode(),
        areaServed: [
          { '@type': 'City', name: 'Melbourne' },
          { '@type': 'State', name: 'Victoria' },
        ],
      },
    ]
    if (content.faqs.length) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      })
    }
    return {
      title: content.seoTitle,
      description: content.metaDescription,
      canonical,
      robots: 'index,follow',
      breadcrumbs: crumbs,
      jsonLd,
    }
  }

  return {
    title: 'Page not found | Grade A Plumbing',
    description: `That page is not on the Grade A Plumbing website. Call ${PHONE} or email ${EMAIL} for plumbing help across Melbourne.`,
    canonical: `${SITE_ORIGIN}${path}`,
    robots: 'noindex,follow',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Page not found' }],
    jsonLd: [],
  }
}

export function headTags(meta: RouteMeta): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const tags = [
    `<link rel="canonical" href="${escape(meta.canonical)}" />`,
    `<meta name="robots" content="${escape(meta.robots)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(BUSINESS_NAME)}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${escape(meta.canonical)}" />`,
    `<meta property="og:image" content="${escape(OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    `<meta name="twitter:image" content="${escape(OG_IMAGE)}" />`,
  ]
  for (const node of meta.jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(node).replace(/</g, '\\u003c')}</script>`)
  }
  return tags.join('\n    ')
}

export { seoContent, PHONE_LINK }
